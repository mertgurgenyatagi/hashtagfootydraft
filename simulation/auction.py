import random
from dataclasses import dataclass

from .bidder import naive_bid_round
from .models import SLOT_POSITION, Bidder, Footballer
from .starting_value import StartingValueFn, linear_ability

DEFAULT_INCREMENTS = [1_000_000, 5_000_000, 10_000_000]


@dataclass
class AuctionResult:
    bidders: list[Bidder]
    unsold: list[Footballer]
    backfilled: dict[str, int]  # bidder name -> number of slots filled by backfill


def run_auction(
    pool: list[Footballer],
    bidders: list[Bidder],
    starting_value_fn: StartingValueFn = linear_ability,
    increments: list[float] | None = None,
    rng: random.Random | None = None,
) -> AuctionResult:
    """Simulates one Auction-format draft to completion per PROJECT.md rules.

    Two rules aren't pinned down in PROJECT.md, so this makes an explicit call:
    footballers that get no bids ("passed") stay available for backfill rather
    than being removed from the game; and position coverage isn't guaranteed,
    so backfill raises if a slot genuinely has nothing left to fill it with.
    """
    increments = increments or DEFAULT_INCREMENTS
    rng = rng or random.Random()

    reveal_order = rng.sample(pool, len(pool))
    unsold: list[Footballer] = []

    for idx, footballer in enumerate(reveal_order):
        winner, price = naive_bid_round(footballer, bidders, starting_value_fn(footballer), increments, rng)
        if winner is not None:
            winner.acquire(footballer, price)
        else:
            unsold.append(footballer)

        remaining = unsold + reveal_order[idx + 1:]
        non_full = [b for b in bidders if not b.is_full()]
        if non_full and all(not _can_afford_anything(b, remaining, starting_value_fn) for b in non_full):
            unsold.extend(reveal_order[idx + 1:])
            break

    backfilled = _backfill(bidders, unsold, starting_value_fn)
    return AuctionResult(bidders=bidders, unsold=unsold, backfilled=backfilled)


def _can_afford_anything(bidder: Bidder, candidates: list[Footballer], starting_value_fn: StartingValueFn) -> bool:
    if bidder.is_full():
        return False
    return any(
        bidder.eligible_open_slots(f) and bidder.remaining_budget >= starting_value_fn(f)
        for f in candidates
    )


def _backfill(bidders: list[Bidder], unsold: list[Footballer], starting_value_fn: StartingValueFn) -> dict[str, int]:
    counts = {b.name: 0 for b in bidders}
    for bidder in bidders:
        for slot in bidder.open_slots():
            position = SLOT_POSITION[slot]
            candidates = [f for f in unsold if position in f.positions]
            if not candidates:
                raise RuntimeError(f"Backfill failed: no unsold footballer eligible for {slot} ({position})")
            cheapest = min(candidates, key=starting_value_fn)
            price = starting_value_fn(cheapest)
            bidder.squad[slot] = (cheapest, price)
            bidder.remaining_budget -= price
            unsold.remove(cheapest)
            counts[bidder.name] += 1
    return counts
