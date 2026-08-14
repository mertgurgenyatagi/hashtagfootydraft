from dataclasses import dataclass, field

# Fixed 4-2-3-1 formation. Two slots share the CB position.
FORMATION_SLOTS = ["GK", "CB1", "CB2", "LB", "RB", "CDM", "CM", "AMF", "LW", "RW", "ST"]

SLOT_POSITION = {
    "GK": "GK", "CB1": "CB", "CB2": "CB", "LB": "LB", "RB": "RB",
    "CDM": "CDM", "CM": "CM", "AMF": "AMF", "LW": "LW", "RW": "RW", "ST": "ST",
}


@dataclass
class Footballer:
    name: str
    nation: str
    age: int
    club: str
    positions: list[str]
    ability: float
    league: str


@dataclass
class Bidder:
    name: str
    starting_budget: float
    remaining_budget: float = None
    squad: dict = field(default_factory=lambda: {slot: None for slot in FORMATION_SLOTS})
    graveyard: list = field(default_factory=list)

    def __post_init__(self):
        if self.remaining_budget is None:
            self.remaining_budget = self.starting_budget

    def open_slots(self):
        return [slot for slot, occupant in self.squad.items() if occupant is None]

    def eligible_open_slots(self, footballer: Footballer):
        return [slot for slot in self.open_slots() if SLOT_POSITION[slot] in footballer.positions]

    def is_full(self):
        return not self.open_slots()

    def spend(self):
        return self.starting_budget - self.remaining_budget

    def acquire(self, footballer: Footballer, price: float):
        self.remaining_budget -= price
        slots = self.eligible_open_slots(footballer)
        if slots:
            self.squad[slots[0]] = (footballer, price)
        else:
            self.graveyard.append((footballer, price))
