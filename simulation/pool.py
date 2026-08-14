import csv

from .models import Footballer


def load_pool(csv_path: str) -> list[Footballer]:
    pool = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pool.append(Footballer(
                name=row["Name"],
                nation=row["Nation"],
                age=int(row["Age"]),
                club=row["Club"],
                positions=[p.strip() for p in row["Position"].split(",")],
                ability=float(row["Current Ability"]),
                league=row["League"],
            ))
    return pool
