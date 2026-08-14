import argparse
import time

from simulation.starting_value import flat, linear_ability
from simulation.valuation import dump_valuations, run_valuation_study

FORMULAS = {
    "zero": lambda player: 0,
    "flat10m": flat,
    "linear": linear_ability,
}


def main():
    parser = argparse.ArgumentParser(description="Monte Carlo player valuation study over Auction-mode simulations.")
    parser.add_argument("--runs", type=int, default=300_000)
    parser.add_argument("--bidders", type=int, default=3)
    parser.add_argument("--budget", type=float, default=1_000_000_000)
    parser.add_argument("--pool", default="player_data.csv")
    parser.add_argument("--out", default="player_valuations.csv")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--progress-every", type=int, default=None, help="Default: ~200 bar updates over the run")
    parser.add_argument("--formula", choices=sorted(FORMULAS), default="flat10m")
    args = parser.parse_args()

    progress_every = args.progress_every or max(1, args.runs // 200)

    start = time.perf_counter()
    stats, completed = run_valuation_study(
        args.runs,
        args.pool,
        bidder_count=args.bidders,
        budget=args.budget,
        starting_value_fn=FORMULAS[args.formula],
        seed=args.seed,
        progress_every=progress_every,
    )
    dump_valuations(stats, args.out, completed)
    elapsed = time.perf_counter() - start
    print(f"Ran {completed}/{args.runs} auctions in {elapsed / 60:.1f} min -> {args.out}")


if __name__ == "__main__":
    main()
