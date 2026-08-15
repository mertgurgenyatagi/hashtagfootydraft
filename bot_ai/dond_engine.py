import random

from simulation.models import FORMATION_SLOTS, SLOT_POSITION

from .types import DecisionKind, PendingDecision

# Rules only say the offer is "deliberately a bit worse" than the remaining boxes'
# average (R3-Q4); the exact haircut is unspecified, so this is a fixed placeholder.
OFFER_DISCOUNT = 0.85


class DealOrNoDealEngine:
    def __init__(self, pool: list, squads: list, rng: random.Random):
        self.pool = pool
        self.squads = squads
        self.rng = rng

    def run(self):
        n = len(self.squads)
        round_slots = list(FORMATION_SLOTS)
        self.rng.shuffle(round_slots)  # one random position per round, all 11 covered (R3's framing)
        used = set()

        for round_idx, slot in enumerate(round_slots):
            position = SLOT_POSITION[slot]
            eligible = [p for p in self.pool if position in p.positions and id(p) not in used]
            self.rng.shuffle(eligible)
            boxes = eligible[: 2 * n]
            for p in boxes:
                used.add(id(p))
            unopened = list(boxes)
            # Up to 2 pops per seat can happen this round (open the box, then possibly
            # "go back to the boxes" for a forced second one), so the safety net has to
            # cover 2n, matching the natural box supply -- not just n.
            self._ensure_enough_boxes(unopened, 2 * n, used)

            start = round_idx % n  # rotating turn order (R5-Q7)
            order = [(start + i) % n for i in range(n)]

            for seat_idx in order:
                squad = self.squads[seat_idx]
                revealed = unopened.pop(self.rng.randrange(len(unopened)))
                choice = yield PendingDecision(
                    seat=squad.seat, kind=DecisionKind.STICK_OR_HEAR,
                    candidates=None, context={"revealed": revealed, "position": position},
                )
                if choice == 0:  # stick
                    squad.place_in_slot(slot, revealed)
                    continue

                avg_ability = (sum(p.ability for p in unopened) / len(unopened)) if unopened else revealed.ability
                offer = self._closest_offer(position, avg_ability * OFFER_DISCOUNT, used)
                used.add(id(offer))
                take_choice = yield PendingDecision(
                    seat=squad.seat, kind=DecisionKind.TAKE_OR_GOBACK,
                    candidates=None,
                    context={"offer": offer, "remaining_unopened_avg_ability": avg_ability,
                             "remaining_unopened_count": len(unopened)},
                )
                if take_choice == 0:  # take it
                    squad.place_in_slot(slot, offer)
                else:  # go back to the boxes -- forced to take the next one opened
                    used.discard(id(offer))
                    forced = unopened.pop(self.rng.randrange(len(unopened))) if unopened else revealed
                    squad.place_in_slot(slot, forced)

    def _closest_offer(self, position: str, target: float, used: set):
        candidates = [p for p in self.pool if position in p.positions and id(p) not in used]
        if not candidates:
            candidates = [p for p in self.pool if position in p.positions]
        if not candidates:
            candidates = self.pool  # pool-wide last resort; see _ensure_enough_boxes
        return min(candidates, key=lambda p: abs(p.ability - target))

    def _ensure_enough_boxes(self, unopened: list, target: int, used: set):
        """Multi-position footballers get consumed across unrelated rounds (a CB/LB
        player used up during the LB round starves a later CB round), so no amount of
        per-position depth tuning up front can perfectly guarantee a round always has
        `target` fresh boxes. Top up in three tiers -- same position, any not-yet-used
        footballer, then (only if the whole pool is somehow exhausted) reuse an
        already-used one -- rather than crash mid-episode."""
        if len(unopened) >= target:
            return
        same_position_ids = {id(p) for p in unopened}
        candidates = [p for p in self.pool if id(p) not in used and id(p) not in same_position_ids]
        self.rng.shuffle(candidates)
        needed = target - len(unopened)
        topped_up = candidates[:needed]
        for p in topped_up:
            used.add(id(p))
        unopened.extend(topped_up)
        if len(unopened) < target:
            reuse_pool = list(self.pool)
            self.rng.shuffle(reuse_pool)
            unopened.extend(reuse_pool[: target - len(unopened)])
