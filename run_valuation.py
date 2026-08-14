import argparse
import time

from simulation.valuation import dump_valuations, run_valuation_study


def main():
    parser = argparse.ArgumentParser(description="Monte Carlo player valuation study over Auction-mode simulations.")
    parser.add_argument("--runs", type=int, default=300_000)
    parser.add_argument("--bidders", type=int, default=3)
    parser.add_argument("--budget", type=float, default=1_000_000_000)
    parser.add_argument("--pool", default="player_data.csv")
    parser.add_argument("--out", default="player_valuations.csv")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--progress-every", type=int, default=10_000)
    args = parser.parse_args()

    start = time.perf_counter()
    stats = run_valuation_study(
        args.runs,
        args.pool,
        bidder_count=args.bidders,
        budget=args.budget,
        seed=args.seed,
        progress_every=args.progress_every,
    )
    dump_valuations(stats, args.out, args.runs)
    elapsed = time.perf_counter() - start
    print(f"Ran {args.runs} auctions in {elapsed / 60:.1f} min -> {args.out}")


if __name__ == "__main__":
    main()
