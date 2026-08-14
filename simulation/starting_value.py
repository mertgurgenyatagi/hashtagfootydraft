from typing import Callable

from .models import Footballer

# A starting-value formula takes a footballer and returns its opening auction price.
# This is the piece the "valuations" work is meant to iterate on -- swap in different
# implementations and compare outcomes via simulation.batch.run_batch.
StartingValueFn = Callable[[Footballer], float]


def linear_ability(player: Footballer, k: float = 1_000_000) -> float:
    """Placeholder formula: starting value scales linearly with current ability."""
    return player.ability * k


def flat(player: Footballer, amount: float = 10_000_000) -> float:
    """Every footballer opens at the same price; competitive bidding does the
    rest of the price discovery. Deliberately not 0: the first bid on a footballer
    costs exactly the starting value (no increment required), so a 0 starting
    value would let uncontested footballers sell for free -- a nonzero floor
    keeps every sale carrying at least some pricing signal."""
    return amount
