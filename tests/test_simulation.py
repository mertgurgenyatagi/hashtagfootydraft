import random

from simulation.auction import run_auction
from simulation.models import FORMATION_SLOTS, Bidder
from simulation.pool import load_pool

POOL_PATH = "player_data.csv"


def _bidders(count=3, budget=1_000_000_000):
    return [Bidder(name=f"Bidder {i + 1}", starting_budget=budget) for i in range(count)]


def test_pool_loads():
    pool = load_pool(POOL_PATH)
    assert len(pool) > 0
    assert all(p.name and p.positions and p.ability > 0 for p in pool)


def test_auction_fills_every_squad_completely():
    pool = load_pool(POOL_PATH)
    bidders = _bidders()
    result = run_auction(pool, bidders, rng=random.Random(1))
    for b in result.bidders:
        assert all(b.squad[slot] is not None for slot in FORMATION_SLOTS)


def test_backfill_triggers_under_low_budget():
    pool = load_pool(POOL_PATH)
    bidders = _bidders(budget=1)  # nobody can afford anything live
    result = run_auction(pool, bidders, rng=random.Random(1))
    assert sum(result.backfilled.values()) == len(FORMATION_SLOTS) * len(bidders)
    for b in result.bidders:
        assert all(b.squad[slot] is not None for slot in FORMATION_SLOTS)


def test_starting_value_formula_is_pluggable():
    pool = load_pool(POOL_PATH)
    cheap_result = run_auction(pool, _bidders(), starting_value_fn=lambda f: 0, rng=random.Random(1))
    pool = load_pool(POOL_PATH)
    normal_result = run_auction(pool, _bidders(), rng=random.Random(1))

    cheap_spend = sum(b.spend() for b in cheap_result.bidders)
    normal_spend = sum(b.spend() for b in normal_result.bidders)
    assert cheap_spend < normal_spend
