import random

from simulation.models import SLOT_POSITION

from .types import DecisionKind, PendingDecision

INCREMENTS = (1_000_000, 5_000_000, 10_000_000)


class AuctionEngine:
    """Free-for-all bidding, one footballer at a time, per PROJECT.md's Auction rules.

    Bid actions are always the fixed 4-way [PASS, RAISE_1, RAISE_5, RAISE_10], even
    though with no live leader the first bid is just the opening price -- all three
    raise options collapse to that same opening-price cost in that state, which the
    network can trivially learn, and it keeps the action space fixed-size.
    """

    def __init__(self, pool: list, squads: list, rng: random.Random):
        self.pool = pool
        self.squads = squads
        self.rng = rng

    def run(self):
        remaining = list(self.pool)
        self.rng.shuffle(remaining)  # fully random reveal order (R3-Q1, R6-Q1)
        unsold = []
        idx = 0
        while idx < len(remaining):
            footballer = remaining[idx]
            winner, price = yield from self._bid_round(footballer)
            if winner is not None:
                winner.place_auto(footballer, price)
            else:
                unsold.append(footballer)
            idx += 1
            if self._auction_exhausted(unsold, remaining[idx:]):
                unsold.extend(remaining[idx:])
                break
        self._backfill(unsold)

    def _bid_round(self, footballer):
        price = footballer.opening_bid
        leader = None
        while True:
            raised_this_pass = False
            for squad in self.squads:
                if squad is leader:
                    continue
                legal_mask, costs = self._legal_bids(squad, price, leader)
                if not any(legal_mask[1:]):
                    continue  # can't afford any raise -- skip rather than force a trivial PASS
                action = yield PendingDecision(
                    seat=squad.seat, kind=DecisionKind.BID, candidates=None,
                    context={"footballer": footballer, "current_price": price, "legal_mask": legal_mask},
                )
                if action != 0 and legal_mask[action]:
                    price = costs[action]
                    leader = squad
                    raised_this_pass = True
            if not raised_this_pass:
                break
        return leader, (price if leader is not None else None)

    def _legal_bids(self, squad, price, leader):
        if leader is None:
            costs = [0.0, price, price, price]
        else:
            costs = [0.0, price + INCREMENTS[0], price + INCREMENTS[1], price + INCREMENTS[2]]
        legal = [True] + [squad.budget_remaining >= c for c in costs[1:]]
        return legal, costs

    def _auction_exhausted(self, unsold, still_to_reveal) -> bool:
        non_full = [s for s in self.squads if not s.is_full()]
        if not non_full:
            return True
        candidates = unsold + still_to_reveal
        for squad in non_full:
            open_positions = {SLOT_POSITION[slot] for slot in squad.open_slots()}
            if any(squad.budget_remaining >= f.opening_bid and open_positions.intersection(f.positions) for f in candidates):
                return False
        return True

    def _backfill(self, unsold):
        for squad in self.squads:
            for slot in squad.open_slots():
                position = SLOT_POSITION[slot]
                candidates = [f for f in unsold if position in f.positions]
                if not candidates:
                    candidates = [f for f in self.pool if position in f.positions]
                cheapest = min(candidates, key=lambda f: f.opening_bid)
                squad.place_in_slot(slot, cheapest, cheapest.opening_bid)
                if cheapest in unsold:
                    unsold.remove(cheapest)
