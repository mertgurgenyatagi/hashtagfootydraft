import random

from .models import Bidder, Footballer

# Probability a bidder raises on a given pass, if they can afford to. Naive/random
# placeholder standing in for real bot decision logic (explicitly deferred -- see
# PROJECT.md). Not ability- or need-aware.
BID_PROBABILITY = 0.35


def naive_bid_round(
    footballer: Footballer,
    bidders: list[Bidder],
    starting_value: float,
    increments: list[float],
    rng: random.Random,
) -> tuple[Bidder | None, float | None]:
    """Runs bidding on a single footballer to resolution.

    Bidding is not gated by slot status or eligibility -- any bidder can bid on
    any footballer (per Auction rules: full-XI players can still bid for the
    graveyard or to block). Returns (winner, price), or (None, None) if nobody bid.
    """
    price = starting_value
    leader = None
    while True:
        raised = False
        for bidder in bidders:
            if bidder is leader:
                continue
            cost = price if leader is None else price + rng.choice(increments)
            if bidder.remaining_budget >= cost and rng.random() < BID_PROBABILITY:
                price = cost
                leader = bidder
                raised = True
        if not raised:
            break
    return (leader, price) if leader is not None else (None, None)
