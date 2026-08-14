import json
import random

from .auction import AuctionResult, run_auction
from .models import Bidder
from .pool import load_pool
from .starting_value import StartingValueFn, flat


def run_batch(
    n: int,
    csv_path: str,
    bidder_count: int = 3,
    budget: float = 1_000_000_000,
    starting_value_fn: StartingValueFn = flat,
    seed: int | None = None,
) -> list[AuctionResult]:
    rng = random.Random(seed)
    results = []
    for _ in range(n):
        pool = load_pool(csv_path)
        bidders = [Bidder(name=f"Bidder {i + 1}", starting_budget=budget) for i in range(bidder_count)]
        results.append(run_auction(pool, bidders, starting_value_fn=starting_value_fn, rng=rng))
    return results


def result_to_dict(result: AuctionResult) -> dict:
    return {
        "bidders": [_bidder_to_dict(b) for b in result.bidders],
        "unsold_count": len(result.unsold),
        "backfilled": result.backfilled,
    }


def _bidder_to_dict(b: Bidder) -> dict:
    squad = {}
    for slot, occupant in b.squad.items():
        squad[slot] = None if occupant is None else {"name": occupant[0].name, "price": occupant[1]}
    return {
        "name": b.name,
        "spend": b.spend(),
        "remaining_budget": b.remaining_budget,
        "squad": squad,
        "graveyard_size": len(b.graveyard),
    }


def dump_batch(results: list[AuctionResult], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump([result_to_dict(r) for r in results], f, indent=2)
