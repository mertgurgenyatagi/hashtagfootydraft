from dataclasses import dataclass
from enum import Enum


@dataclass(frozen=True)
class Player:
    name: str
    nation: str
    age: int
    club: str
    positions: tuple
    ability: float
    league: str
    derived_price: float
    opening_bid: float


class Format(Enum):
    AUCTION = "auction"
    DEAL_OR_NO_DEAL = "deal_or_no_deal"
    FREE_PICK = "free_pick"
    SPIN_THE_WHEEL = "spin_the_wheel"


class ScopeType(Enum):
    ALL = "all"
    TOP5 = "top5"
    LEAGUE = "league"
    NATIONALITY = "nationality"


class Constraint(Enum):
    NONE = "none"
    ONE_PER_CLUB = "1_per_club"
    THREE_PER_CLUB = "3_per_club"
    ONE_PER_NATIONALITY = "1_per_nationality"
    THREE_PER_NATIONALITY = "3_per_nationality"


class DecisionKind(Enum):
    PICK = "pick"
    BID = "bid"
    STICK_OR_HEAR = "stick_or_hear"
    TAKE_OR_GOBACK = "take_or_goback"


# Matches the CSV's League column exactly (PROJECT.md's plain-English names, e.g.
# "Ligue 1", don't match the raw data string).
TOP5_LEAGUES = ("Premier Division", "Serie A", "First Division", "Bundesliga", "Ligue 1 Uber Eats")


@dataclass
class EpisodeConfig:
    format: Format
    scope_type: ScopeType
    scope_value: str
    constraint: Constraint
    lobby_size: int
    seed: int


@dataclass
class PendingDecision:
    seat: int
    kind: DecisionKind
    candidates: list
    context: dict
