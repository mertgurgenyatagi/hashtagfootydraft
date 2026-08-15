import random

from .constraints import constraint_ok
from .types import Constraint, DecisionKind, PendingDecision


class FreePickEngine:
    def __init__(self, pool: list, squads: list, constraint: Constraint, rng: random.Random):
        self.pool = pool
        self.squads = squads
        self.constraint = constraint
        self.rng = rng

    def run(self):
        n = len(self.squads)
        remaining = list(self.pool)
        for round_idx in range(11):
            order = range(n) if round_idx % 2 == 0 else reversed(range(n))
            for seat_idx in order:
                squad = self.squads[seat_idx]
                candidates = [
                    p for p in remaining
                    if squad.eligible_open_slots(p) and constraint_ok(self.constraint, squad.players(), p)
                ]
                if not candidates:
                    # Constraint deadlock: PROJECT.md item 21 flags this as unresolved
                    # ("believed unlikely, no fallback defined"). Falling back to
                    # ignoring the constraint (rather than stalling) is this training
                    # environment's placeholder choice.
                    candidates = [p for p in remaining if squad.eligible_open_slots(p)]
                if not candidates:
                    candidates = remaining  # last-resort safety net; place_auto() handles a non-fitting pick gracefully

                choice = yield PendingDecision(seat=squad.seat, kind=DecisionKind.PICK, candidates=candidates, context={})
                picked = candidates[choice]
                squad.place_auto(picked)
                remaining.remove(picked)
