import csv
import random

from simulation.models import FORMATION_SLOTS

from .types import Constraint, EpisodeConfig, Format, Player, ScopeType, TOP5_LEAGUES

SLOT_POSITIONS = ("GK", "CB", "LB", "RB", "CDM", "CM", "AMF", "LW", "RW", "ST")

# Depth headroom, in multiples of lobby_size, required per position before a scope/pool
# is considered feasible. Deal or No Deal needs much more: each round burns 2*lobby_size
# boxed footballers for one position, and CB alone gets two rounds (two formation slots
# share it), so it gets double again. Getting this wrong doesn't corrupt a draft -- it
# crashes mid-episode when a round can't find enough eligible unopened boxes.
GENERAL_MULTIPLIER = 3
DOND_MULTIPLIER = 6


def load_players(csv_path: str) -> list:
    players = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            positions = tuple(p.strip() for p in row["Position"].split(",") if p.strip() in SLOT_POSITIONS)
            if not positions:
                continue
            players.append(Player(
                name=row["Name"], nation=row["Nation"], age=int(row["Age"]), club=row["Club"],
                positions=positions, ability=float(row["Current Ability"]), league=row["League"],
                derived_price=float(row["Derived Price (EURm)"]), opening_bid=float(row["Opening Bid (EURm)"]),
            ))
    return players


def _position_depth(players: list) -> dict:
    depth = {pos: 0 for pos in SLOT_POSITIONS}
    for player in players:
        for pos in player.positions:
            depth[pos] += 1
    return depth


def _required_depth(lobby_size: int, pos: str, fmt: Format) -> int:
    if fmt != Format.DEAL_OR_NO_DEAL:
        return lobby_size * GENERAL_MULTIPLIER
    base = lobby_size * DOND_MULTIPLIER
    return base * 2 if pos == "CB" else base


def _meets_depth(players: list, lobby_size: int, fmt: Format) -> bool:
    depth = _position_depth(players)
    return all(depth[pos] >= _required_depth(lobby_size, pos, fmt) for pos in SLOT_POSITIONS)


def _filter_scope(players: list, scope_type: ScopeType, scope_value):
    if scope_type == ScopeType.ALL:
        return players
    if scope_type == ScopeType.TOP5:
        return [p for p in players if p.league in TOP5_LEAGUES]
    if scope_type == ScopeType.LEAGUE:
        return [p for p in players if p.league == scope_value]
    return [p for p in players if p.nation == scope_value]


def sample_scope(rng: random.Random, all_players: list, lobby_size: int, fmt: Format):
    leagues = sorted({p.league for p in all_players if p.league and p.league != "-"})
    nations = sorted({p.nation for p in all_players})

    options = [(ScopeType.ALL, None), (ScopeType.TOP5, None)]
    options += [(ScopeType.LEAGUE, lg) for lg in leagues]
    options += [(ScopeType.NATIONALITY, nat) for nat in nations]
    rng.shuffle(options)

    for scope_type, scope_value in options:
        filtered = _filter_scope(all_players, scope_type, scope_value)
        if _meets_depth(filtered, lobby_size, fmt):
            return scope_type, scope_value, filtered
    # ALL is always the last resort and is feasible for lobby_size<=5 given this dataset's depth.
    return ScopeType.ALL, None, all_players


def _weighted_sample_without_replacement(rng: random.Random, items: list, weights: list, k: int) -> list:
    pool = list(zip(items, weights))
    chosen = []
    for _ in range(min(k, len(pool))):
        total = sum(w for _, w in pool)
        r = rng.random() * total
        upto = 0.0
        for i, (item, w) in enumerate(pool):
            upto += w
            if upto >= r:
                chosen.append(item)
                pool.pop(i)
                break
    return chosen


def sample_pool(rng: random.Random, scope_players: list, lobby_size: int, fmt: Format) -> list:
    multiplier = DOND_MULTIPLIER if fmt == Format.DEAL_OR_NO_DEAL else GENERAL_MULTIPLIER
    target_size = min(len(scope_players), max(11 * lobby_size * multiplier, 60))

    if target_size >= len(scope_players):
        chosen = list(scope_players)
    else:
        # Skew toward higher ability so drafts feel star-studded (PROJECT.md, Player Data
        # Pool). The exact curve is an open project-wide question (item 3/16); quadratic
        # weighting is a simple, defensible placeholder.
        weights = [p.ability ** 2 for p in scope_players]
        chosen = _weighted_sample_without_replacement(rng, scope_players, weights, target_size)

    chosen_ids = {id(p) for p in chosen}
    depth = _position_depth(chosen)
    for pos in SLOT_POSITIONS:
        need = _required_depth(lobby_size, pos, fmt) - depth[pos]
        if need <= 0:
            continue
        extra = [p for p in scope_players if pos in p.positions and id(p) not in chosen_ids]
        extra.sort(key=lambda p: -p.ability)
        for p in extra[:need]:
            chosen.append(p)
            chosen_ids.add(id(p))

    rng.shuffle(chosen)
    return chosen


def compute_auction_budget(pool: list) -> float:
    """Enough to buy a full XI at the pool's average market rate -- i.e. the average
    Derived Price times the 11 formation slots. Without the x11 the budget is one
    average footballer's price for an entire squad, which makes almost every
    footballer unaffordable and hands the whole XI to the auction's backfill rule."""
    return sum(p.derived_price for p in pool) / len(pool) * len(FORMATION_SLOTS)


def sample_episode_config(rng: random.Random, all_players: list, lobby_size: int = None, format_override: Format = None):
    lobby_size = lobby_size or rng.randint(2, 5)
    fmt = format_override or rng.choice(list(Format))

    scope_type, scope_value, scope_players = sample_scope(rng, all_players, lobby_size, fmt)
    pool = sample_pool(rng, scope_players, lobby_size, fmt)

    constraint = rng.choice(list(Constraint)[1:]) if fmt == Format.FREE_PICK else Constraint.NONE
    budget = compute_auction_budget(pool) if fmt == Format.AUCTION else 0.0

    config = EpisodeConfig(
        format=fmt, scope_type=scope_type, scope_value=scope_value,
        constraint=constraint, lobby_size=lobby_size, seed=rng.randrange(2 ** 31),
    )
    return config, pool, budget
