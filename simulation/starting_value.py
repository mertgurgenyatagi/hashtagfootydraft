from typing import Callable

from .models import Footballer

# A starting-value formula takes a footballer and returns its opening auction price.
# This is the piece the "valuations" work is meant to iterate on -- swap in different
# implementations and compare outcomes via simulation.batch.run_batch.
StartingValueFn = Callable[[Footballer], float]


def linear_ability(player: Footballer, k: float = 1_000_000) -> float:
    """Placeholder formula: starting value scales linearly with current ability."""
    return player.ability * k
