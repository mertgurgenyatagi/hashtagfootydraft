import random

import torch

from bot_ai.env import DraftEnv
from bot_ai.league import OpponentLeague
from bot_ai.networks import PolicyValueNet
from bot_ai.observation import GLOBAL_DIM
from bot_ai.pool_sampling import load_players
from bot_ai.ppo import collect_rollout, ppo_update
from bot_ai.types import Format
from simulation.models import FORMATION_SLOTS

POOL_PATH = "player_data.csv"
DEVICE = torch.device("cpu")


def _league(tmp_path):
    return OpponentLeague(DEVICE, checkpoint_dir=tmp_path)


def test_global_encoding_matches_declared_dim(tmp_path):
    players = load_players(POOL_PATH)
    env = DraftEnv(players, _league(tmp_path))
    g, c, mask, kind = env.reset(random.Random(0))
    assert g.shape[0] == GLOBAL_DIM


def test_every_format_completes_a_full_squad_for_every_seat(tmp_path):
    players = load_players(POOL_PATH)
    league = _league(tmp_path)
    for fmt in Format:
        for trial in range(6):
            env = DraftEnv(players, league)
            rng = random.Random(hash((fmt.value, trial)) % (2 ** 31))
            obs = env.reset(rng, format_override=fmt)
            steps = 0
            done = False
            while not done:
                g, candidates, legal_mask, kind = obs
                if kind.value == "pick":
                    action = rng.randrange(len(candidates))
                elif kind.value == "bid":
                    legal = [i for i, ok in enumerate(legal_mask) if ok]
                    action = rng.choice(legal)
                else:
                    action = rng.randrange(2)
                step = env.step(action)
                done = step.done
                obs = step.obs
                steps += 1
                assert steps < 20000, f"{fmt} episode did not terminate"
            for squad in env.squads:
                assert all(squad.slots[slot] is not None for slot in FORMATION_SLOTS), \
                    f"{fmt} left an unfilled slot for seat {squad.seat}"


def test_ppo_update_runs_without_error(tmp_path):
    players = load_players(POOL_PATH)
    league = _league(tmp_path)
    env = DraftEnv(players, league)
    net = PolicyValueNet()
    optimizer = torch.optim.Adam(net.parameters(), lr=3e-4)
    buffer, ep_rewards = collect_rollout(env, net, DEVICE, n_steps=64, rng=random.Random(1))
    stats = ppo_update(net, optimizer, buffer, DEVICE)
    assert "policy_loss" in stats and "value_loss" in stats


def test_league_gating_promotes_first_challenger_and_holds_a_worse_one(tmp_path):
    players = load_players(POOL_PATH)
    league = _league(tmp_path)
    net = PolicyValueNet()

    first = league.promote_if_better(net, players, n_eval_episodes=1, win_rate_threshold=0.55, rng=random.Random(2))
    assert first["promoted"] is True
    assert league.champion is not None
    version_after_first = league.champion_version

    challenger = PolicyValueNet()
    result = league.promote_if_better(challenger, players, n_eval_episodes=4, win_rate_threshold=1.1, rng=random.Random(3))
    assert result["promoted"] is False
    assert league.champion_version == version_after_first  # champion held, no regression
