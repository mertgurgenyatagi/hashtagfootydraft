import random

from .types import DecisionKind, PendingDecision, ScopeType

_ATTR = {"club": "club", "league": "league", "nationality": "nation"}


def eligible_wheel_categories(scope_type: ScopeType) -> list:
    if scope_type == ScopeType.LEAGUE:
        return ["club", "nationality"]
    if scope_type == ScopeType.NATIONALITY:
        return ["league", "club"]
    return ["league", "club", "nationality"]


class SpinTheWheelEngine:
    def __init__(self, pool: list, squads: list, scope_type: ScopeType, rng: random.Random):
        self.pool = pool
        self.squads = squads
        self.scope_type = scope_type
        self.rng = rng

    def run(self):
        category = self.rng.choice(eligible_wheel_categories(self.scope_type))  # fixed for the whole draft (R5-Q1)
        attr = _ATTR[category]
        n = len(self.squads)
        remaining = list(self.pool)

        for round_idx in range(11):
            order = range(n) if round_idx % 2 == 0 else reversed(range(n))
            for seat_idx in order:
                squad = self.squads[seat_idx]
                open_pool = [p for p in remaining if squad.eligible_open_slots(p)]
                values = list({getattr(p, attr) for p in open_pool})
                candidates = []
                if values:
                    spin_value = self.rng.choice(values)
                    candidates = [p for p in open_pool if getattr(p, attr) == spin_value]
                if not candidates:
                    candidates = open_pool  # dry spin -> free pick for this turn only (R2-Q4)
                if not candidates:
                    candidates = remaining  # last-resort safety net

                choice = yield PendingDecision(
                    seat=squad.seat, kind=DecisionKind.PICK, candidates=candidates, context={"category": category},
                )
                picked = candidates[choice]
                squad.place_auto(picked)
                remaining.remove(picked)
