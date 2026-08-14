import argparse

from simulation.batch import dump_batch, run_batch


def main():
    parser = argparse.ArgumentParser(description="Run Auction-format Monte Carlo simulations.")
    parser.add_argument("--runs", type=int, default=10)
    parser.add_argument("--bidders", type=int, default=3)
    parser.add_argument("--budget", type=float, default=1_000_000_000)
    parser.add_argument("--pool", default="player_data.csv")
    parser.add_argument("--out", default="simulation_results.json")
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()

    results = run_batch(args.runs, args.pool, bidder_count=args.bidders, budget=args.budget, seed=args.seed)
    dump_batch(results, args.out)
    print(f"Ran {args.runs} auctions -> {args.out}")


if __name__ == "__main__":
    main()
