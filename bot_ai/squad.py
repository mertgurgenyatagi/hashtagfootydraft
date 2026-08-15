from dataclasses import dataclass, field

from simulation.models import FORMATION_SLOTS, SLOT_POSITION

from .types import Player


@dataclass
class Squad:
    seat: int
    budget_total: float = 0.0
    budget_remaining: float = 0.0
    slots: dict = field(default_factory=lambda: {slot: None for slot in FORMATION_SLOTS})
    graveyard: list = field(default_factory=list)

    def open_slots(self):
        return [slot for slot, occupant in self.slots.items() if occupant is None]

    def eligible_open_slots(self, player: Player):
        return [slot for slot in self.open_slots() if SLOT_POSITION[slot] in player.positions]

    def is_full(self):
        return not self.open_slots()

    def players(self):
        return [p for p in self.slots.values() if p is not None]

    def place_in_slot(self, slot: str, player: Player, price: float = 0.0):
        self.slots[slot] = player
        self.budget_remaining -= price

    def place_auto(self, player: Player, price: float = 0.0):
        """Used by formats without a designated slot per pick (Auction, Free Pick,
        Spin the Wheel): fills the first eligible open slot, or -- Auction only,
        since it's the sole format with a graveyard -- overflows there."""
        slots = self.eligible_open_slots(player)
        if slots:
            self.slots[slots[0]] = player
        else:
            self.graveyard.append(player)
        self.budget_remaining -= price

    def total_ability(self):
        return sum(p.ability for p in self.players())
