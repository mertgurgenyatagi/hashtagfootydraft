import copy
import random
from pathlib import Path

import torch

from .bots import make_bot_roster
from .networks import PolicyValueNet
from .observation import encode_candidates, encode_global
from .squad import Squad
from .types import DecisionKind


class FrozenPolicy:
    """Wraps a frozen network snapshot behind the same .act(decision, env) interface
    as the heuristic bots, so DraftEnv doesn't need to distinguish self-play
    opponents from scripted ones."""

    def __init__(self, net: PolicyValueNet, device):
        self.net = net
        self.device = device

    def act(self, decision, env) -> int:
        squad_seat = decision.seat
        g = encode_global(decision, env.config, env.squads, squad_seat, env.budget).to(self.device)
        if decision.kind == DecisionKind.PICK:
            c = encode_candidates(decision.candidates).to(self.device)
            action, *_ = self.net.act(decision.kind, g, c, None)
        elif decision.kind == DecisionKind.BID:
            action, *_ = self.net.act(decision.kind, g, None, decision.context["legal_mask"])
        else:
            action, *_ = self.net.act(decision.kind, g, None, [True, True])
        return action


class OpponentLeague:
    """The training league: a mix of fixed scripted bots and frozen self-play
    snapshots (the current champion plus a bounded history of past champions).
    Only promote_if_better() ever changes what "champion" points to, and only when
    a challenger demonstrably beats it -- so the model exposed to the league (and
    to the dashboard as "current best") never regresses, even though the actively
    training weights can wobble episode to episode."""

    def __init__(self, device, checkpoint_dir, bot_weight: float = 0.4, champion_weight: float = 0.3):
        self.device = device
        self.checkpoint_dir = Path(checkpoint_dir) if checkpoint_dir is not None else None
        self.bot_weight = bot_weight
        self.champion_weight = champion_weight
        self._bot_rng = random.Random()
        self.champion = None
        self.champion_version = 0
        self.history = []

    def load_champion_if_exists(self):
        if self.checkpoint_dir is None:
            return
        path = self.checkpoint_dir / "champion.pt"
        if not path.exists():
            return
        state = torch.load(path, map_location=self.device)
        net = PolicyValueNet().to(self.device)
        net.load_state_dict(state["model"])
        net.eval()
        self.champion = net
        self.champion_version = state.get("version", 0)

    def sample(self, rng: random.Random, n: int) -> list:
        opponents = []
        for _ in range(n):
            r = rng.random()
            if r < self.bot_weight or self.champion is None:
                opponents.append(rng.choice(make_bot_roster(self._bot_rng)))
            elif r < self.bot_weight + self.champion_weight or not self.history:
                opponents.append(FrozenPolicy(self.champion, self.device))
            else:
                _, net = rng.choice(self.history)
                opponents.append(FrozenPolicy(net, self.device))
        return opponents

    def promote_if_better(self, candidate_net: PolicyValueNet, players: list, n_eval_episodes: int, win_rate_threshold: float, rng: random.Random) -> dict:
        if self.champion is None:
            self._set_champion(candidate_net)
            return {"promoted": True, "reason": "no prior champion", "win_rate": 1.0, "n_games": 0}

        win_rate = _arena_win_rate(candidate_net, self.champion, players, self.device, n_eval_episodes, rng)
        promoted = win_rate >= win_rate_threshold
        if promoted:
            self.history.append((self.champion_version, self.champion))
            self.history = self.history[-10:]  # bounded so an indefinite run doesn't grow this forever
            self._set_champion(candidate_net)
        return {"promoted": promoted, "win_rate": win_rate, "n_games": n_eval_episodes}

    def _set_champion(self, net: PolicyValueNet):
        self.champion = copy.deepcopy(net).eval()
        self.champion_version += 1
        if self.checkpoint_dir is not None:
            torch.save(
                {"model": self.champion.state_dict(), "version": self.champion_version},
                self.checkpoint_dir / "champion.pt",
            )


class _ArenaContext:
    """Minimal stand-in for the attributes FrozenPolicy.act(decision, env) reads off
    a DraftEnv, without needing a full env instance for a plain head-to-head match."""

    def __init__(self, config, squads, budget):
        self.config = config
        self.squads = squads
        self.budget = budget


def _play_arena_episode(net_a: PolicyValueNet, net_b: PolicyValueNet, players: list, device, rng: random.Random) -> float:
    from .env import ENGINES
    from .pool_sampling import sample_episode_config

    config, pool, budget = sample_episode_config(rng, players, lobby_size=2)
    squads = [
        Squad(seat=0, budget_total=budget, budget_remaining=budget),
        Squad(seat=1, budget_total=budget, budget_remaining=budget),
    ]
    policies = {0: FrozenPolicy(net_a, device), 1: FrozenPolicy(net_b, device)}
    ctx = _ArenaContext(config, squads, budget)

    engine = ENGINES[config.format](pool, squads, config, rng)
    gen = engine.run()
    try:
        decision = gen.send(None)
        while True:
            action = policies[decision.seat].act(decision, ctx)
            decision = gen.send(action)
    except StopIteration:
        pass

    a, b = squads[0].total_ability(), squads[1].total_ability()
    if a > b:
        return 1.0
    if a < b:
        return 0.0
    return 0.5


def _arena_win_rate(net_a: PolicyValueNet, net_b: PolicyValueNet, players: list, device, n_episodes: int, rng: random.Random) -> float:
    return sum(_play_arena_episode(net_a, net_b, players, device, rng) for _ in range(n_episodes)) / n_episodes
