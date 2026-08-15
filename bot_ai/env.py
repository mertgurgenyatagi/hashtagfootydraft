import random
import statistics
from dataclasses import dataclass

from .auction_engine import AuctionEngine
from .dond_engine import DealOrNoDealEngine
from .free_pick_engine import FreePickEngine
from .observation import encode_candidates, encode_global
from .pool_sampling import sample_episode_config
from .squad import Squad
from .types import DecisionKind, Format
from .wheel_engine import SpinTheWheelEngine

ENGINES = {
    Format.AUCTION: lambda pool, squads, config, rng: AuctionEngine(pool, squads, rng),
    Format.DEAL_OR_NO_DEAL: lambda pool, squads, config, rng: DealOrNoDealEngine(pool, squads, rng),
    Format.FREE_PICK: lambda pool, squads, config, rng: FreePickEngine(pool, squads, config.constraint, rng),
    Format.SPIN_THE_WHEEL: lambda pool, squads, config, rng: SpinTheWheelEngine(pool, squads, config.scope_type, rng),
}


@dataclass
class StepResult:
    obs: tuple
    reward: float
    done: bool


class DraftEnv:
    """Single-learner-seat multi-format draft environment. Every episode randomly
    samples format/scope/constraint/lobby size, seats the learner once, and fills
    the remaining seats from an opponent league (scripted bots + self-play
    snapshots). Opponent turns resolve internally; step()/reset() only ever
    surface a decision when it's the learner's turn -- from the caller's side this
    looks like an ordinary single-agent env."""

    def __init__(self, players: list, opponent_pool):
        self.players = players
        self.opponent_pool = opponent_pool

    def reset(self, rng: random.Random, format_override: Format = None):
        self.rng = rng
        self.config, self.pool, self.budget = sample_episode_config(rng, self.players, format_override=format_override)
        self.squads = [
            Squad(seat=i, budget_total=self.budget, budget_remaining=self.budget)
            for i in range(self.config.lobby_size)
        ]
        self.learner_seat = rng.randrange(self.config.lobby_size)
        opponent_seats = [s.seat for s in self.squads if s.seat != self.learner_seat]
        self.opponents = dict(zip(opponent_seats, self.opponent_pool.sample(rng, len(opponent_seats))))

        engine = ENGINES[self.config.format](self.pool, self.squads, self.config, rng)
        self._gen = engine.run()
        decision = self._advance(None)
        return self._encode(decision)

    def step(self, action: int) -> StepResult:
        decision = self._advance(action)
        if decision is None:
            return StepResult(obs=None, reward=self._final_reward(), done=True)
        return StepResult(obs=self._encode(decision), reward=0.0, done=False)

    def _advance(self, action):
        try:
            decision = self._gen.send(action)
        except StopIteration:
            return None
        while decision.seat != self.learner_seat:
            bot_action = self.opponents[decision.seat].act(decision, self)
            try:
                decision = self._gen.send(bot_action)
            except StopIteration:
                return None
        return decision

    def _encode(self, decision):
        g = encode_global(decision, self.config, self.squads, self.learner_seat, self.budget)
        if decision.kind == DecisionKind.PICK:
            return g, encode_candidates(decision.candidates), None, decision.kind
        if decision.kind == DecisionKind.BID:
            return g, None, decision.context["legal_mask"], decision.kind
        return g, None, [True, True], decision.kind

    def _final_reward(self) -> float:
        avgs = [s.total_ability() / 11.0 for s in self.squads]
        mine = avgs[self.learner_seat]
        others = [a for i, a in enumerate(avgs) if i != self.learner_seat]
        mean_others = statistics.mean(others) if others else mine
        std_all = statistics.pstdev(avgs) if len(avgs) > 1 else 1.0
        reward = (mine - mean_others) / (std_all + 1e-6)
        return max(-3.0, min(3.0, reward))
