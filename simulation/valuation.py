import csv
import random
from dataclasses import dataclass

from .auction import run_auction
from .models import Bidder
from .pool import load_pool
from .starting_value import StartingValueFn, flat


@dataclass
class PlayerStats:
    ability: float
    times_acquired: int = 0
    total_price: float = 0.0

    @property
    def avg_price(self):
        return self.total_price / self.times_acquired if self.times_acquired else None

    @property
    def ability_per_price(self):
        # Squad value is the total current-ability sum, so this is how much of that
        # value a player delivers per unit of money spent acquiring them -- a
        # "bang for buck" signal derived purely from simulated market behavior.
        avg = self.avg_price
        return self.ability / avg if avg else None  # guards both None and a literal 0 price


def run_valuation_study(
    n: int,
    csv_path: str,
    bidder_count: int = 3,
    budget: float = 1_000_000_000,
    starting_value_fn: StartingValueFn = flat,
    seed: int | None = None,
    progress_every: int | None = None,
) -> dict[str, PlayerStats]:
    """Runs n simulated auctions and tallies, per player, how they fared in the
    market: how often they land in a *finished squad* (graveyard buys don't count,
    since they never contribute to a squad's ability total) and what price they
    fetched when they did.
    """
    pool = load_pool(csv_path)  # static data, safe to reuse across every run
    stats = {p.name: PlayerStats(ability=p.ability) for p in pool}
    rng = random.Random(seed)

    for i in range(n):
        bidders = [Bidder(name=f"Bidder {j + 1}", starting_budget=budget) for j in range(bidder_count)]
        result = run_auction(pool, bidders, starting_value_fn=starting_value_fn, rng=rng)
        for b in result.bidders:
            for occupant in b.squad.values():
                footballer, price = occupant
                s = stats[footballer.name]
                s.times_acquired += 1
                s.total_price += price
        if progress_every and (i + 1) % progress_every == 0:
            print(f"{i + 1}/{n} auctions simulated")

    return stats


def dump_valuations(stats: dict[str, PlayerStats], path: str, n: int) -> None:
    rows = sorted(stats.items(), key=lambda kv: (kv[1].avg_price is not None, kv[1].avg_price or 0), reverse=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Ability", "Times Acquired", "Acquisition Rate", "Avg Price", "Ability Per Price"])
        for name, s in rows:
            writer.writerow([
                name,
                s.ability,
                s.times_acquired,
                round(s.times_acquired / n, 4),
                round(s.avg_price, 2) if s.avg_price is not None else "",
                round(s.ability_per_price, 8) if s.ability_per_price is not None else "",
            ])
