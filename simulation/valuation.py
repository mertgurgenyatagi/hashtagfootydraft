import csv
import random
import sys
import time
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
    times_in_winning_squad: int = 0

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

    @property
    def win_rate(self):
        # Of the auctions where this player landed in a finished squad, how often
        # was that the winning squad (highest total ability among that auction's
        # bidders)? Sidesteps price noise from naive/random bidding entirely --
        # this correlates presence with outcome instead.
        return self.times_in_winning_squad / self.times_acquired if self.times_acquired else None


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
    start_time = time.perf_counter()

    for i in range(n):
        bidders = [Bidder(name=f"Bidder {j + 1}", starting_budget=budget) for j in range(bidder_count)]
        result = run_auction(pool, bidders, starting_value_fn=starting_value_fn, rng=rng)

        squad_ability = {b.name: sum(f.ability for f, _ in b.squad.values()) for b in result.bidders}
        best = max(squad_ability.values())
        winning_bidders = {name for name, total in squad_ability.items() if total == best}

        for b in result.bidders:
            is_winner = b.name in winning_bidders
            for occupant in b.squad.values():
                footballer, price = occupant
                s = stats[footballer.name]
                s.times_acquired += 1
                s.total_price += price
                if is_winner:
                    s.times_in_winning_squad += 1
        if progress_every and (i + 1) % progress_every == 0:
            _print_progress_bar(i + 1, n, start_time)

    if progress_every:
        _print_progress_bar(n, n, start_time)
        sys.stdout.write("\n")

    return stats


def _print_progress_bar(done: int, total: int, start_time: float, width: int = 30) -> None:
    frac = done / total
    filled = int(width * frac)
    bar = "#" * filled + "-" * (width - filled)
    elapsed = time.perf_counter() - start_time
    eta = elapsed / frac - elapsed if frac else 0.0
    sys.stdout.write(f"\r[{bar}] {frac * 100:5.1f}%  {done}/{total}  elapsed {elapsed:6.1f}s  eta {eta:6.1f}s")
    sys.stdout.flush()


def dump_valuations(stats: dict[str, PlayerStats], path: str, n: int) -> None:
    rows = sorted(stats.items(), key=lambda kv: (kv[1].win_rate is not None, kv[1].win_rate or 0), reverse=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Name", "Ability", "Times Acquired", "Acquisition Rate",
            "Avg Price", "Ability Per Price", "Win Rate",
        ])
        for name, s in rows:
            writer.writerow([
                name,
                s.ability,
                s.times_acquired,
                round(s.times_acquired / n, 4),
                round(s.avg_price, 2) if s.avg_price is not None else "",
                round(s.ability_per_price, 8) if s.ability_per_price is not None else "",
                round(s.win_rate, 4) if s.win_rate is not None else "",
            ])
