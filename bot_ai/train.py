"""Indefinite self-play training for the #footydraft bot AI.

Not run automatically by anything in this repo -- start it yourself:

    python -m bot_ai.train

Runs until you stop it (Ctrl+C). Checkpoints to --checkpoint-dir every
CHECKPOINT_EVERY updates (resumable: rerunning the same command picks back up
from learner_latest.pt). Every ARENA_EVERY updates, the current weights are
arena-tested against the reigning champion; champion.pt only ever advances when
the challenger wins by ARENA_WIN_RATE or better, so the model actually exposed to
the league (and reported to the dashboard) never regresses, even though the
actively-training weights can wobble update to update.
"""

import argparse
import json
import random
import time
from pathlib import Path

import torch

from .env import DraftEnv
from .league import OpponentLeague
from .networks import PolicyValueNet
from .pool_sampling import load_players
from .ppo import collect_rollout, ppo_update

ROLLOUT_STEPS = 2048
CHECKPOINT_EVERY = 10  # updates
ARENA_EVERY = 20       # updates
ARENA_EPISODES = 40
ARENA_WIN_RATE = 0.55
LEARNING_RATE = 3e-4


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pool", default="player_data.csv")
    parser.add_argument("--checkpoint-dir", default="checkpoints")
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()

    device = torch.device(args.device)
    checkpoint_dir = Path(args.checkpoint_dir)
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    players = load_players(args.pool)
    rng = random.Random()

    net = PolicyValueNet().to(device)
    optimizer = torch.optim.Adam(net.parameters(), lr=LEARNING_RATE)

    league = OpponentLeague(device, checkpoint_dir)
    league.load_champion_if_exists()

    update = 0
    latest_path = checkpoint_dir / "learner_latest.pt"
    if latest_path.exists():
        state = torch.load(latest_path, map_location=device)
        net.load_state_dict(state["model"])
        optimizer.load_state_dict(state["optimizer"])
        update = state["update"]

    env = DraftEnv(players, league)
    reward_history = []
    start_time = time.time()

    print(f"Training on {device}. Checkpoints in {checkpoint_dir.resolve()}. Ctrl+C to stop.")

    while True:
        buffer, ep_rewards = collect_rollout(env, net, device, ROLLOUT_STEPS, rng)
        stats = ppo_update(net, optimizer, buffer, device)
        update += 1
        reward_history.extend(ep_rewards)
        reward_history = reward_history[-500:]

        status = {
            "update": update,
            "elapsed_seconds": time.time() - start_time,
            "device": str(device),
            "recent_avg_reward": sum(reward_history) / len(reward_history) if reward_history else 0.0,
            "reward_history": reward_history[-100:],
            "policy_loss": stats["policy_loss"],
            "value_loss": stats["value_loss"],
            "entropy": stats["entropy"],
            "champion_version": league.champion_version,
        }

        if update % CHECKPOINT_EVERY == 0:
            torch.save(
                {"model": net.state_dict(), "optimizer": optimizer.state_dict(), "update": update},
                latest_path,
            )

        if update % ARENA_EVERY == 0:
            result = league.promote_if_better(net, players, ARENA_EPISODES, ARENA_WIN_RATE, rng)
            status["last_arena"] = result
            status["champion_version"] = league.champion_version

        (checkpoint_dir / "status.json").write_text(json.dumps(status, indent=2))


if __name__ == "__main__":
    main()
