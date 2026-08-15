from .types import Constraint, Player


def constraint_ok(constraint: Constraint, current_squad_players: list, candidate: Player) -> bool:
    if constraint == Constraint.NONE:
        return True
    if constraint in (Constraint.ONE_PER_CLUB, Constraint.THREE_PER_CLUB):
        cap = 1 if constraint == Constraint.ONE_PER_CLUB else 3
        count = sum(1 for p in current_squad_players if p.club == candidate.club)
        return count < cap
    cap = 1 if constraint == Constraint.ONE_PER_NATIONALITY else 3
    count = sum(1 for p in current_squad_players if p.nation == candidate.nation)
    return count < cap
