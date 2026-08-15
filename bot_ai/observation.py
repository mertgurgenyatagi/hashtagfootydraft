import torch

from simulation.models import FORMATION_SLOTS

from .types import Constraint, DecisionKind, Format, ScopeType

FORMATS = list(Format)
SCOPES = list(ScopeType)
CONSTRAINTS = list(Constraint)
DECISIONS = list(DecisionKind)
POSITIONS = ("GK", "CB", "LB", "RB", "CDM", "CM", "AMF", "LW", "RW", "ST")

MAX_ABILITY = 200.0  # headroom above the pool's observed max (181) for normalization

GLOBAL_DIM = (
    len(FORMATS) + len(SCOPES) + len(CONSTRAINTS) + len(DECISIONS)  # one-hots
    + 2                        # lobby_size, opponent_count
    + len(FORMATION_SLOTS)     # my slot-filled flags
    + 1                        # my total ability
    + 2                        # opponents' avg ability, avg open slots
    + 1                        # budget fraction remaining
    + 3                        # decision-specific context
)
CANDIDATE_DIM = len(POSITIONS) + 2  # position multi-hot + ability + age


def _onehot(value, options: list) -> list:
    v = [0.0] * len(options)
    v[options.index(value)] = 1.0
    return v


def encode_global(decision, config, squads: list, learner_seat: int, budget_total: float) -> torch.Tensor:
    squad = squads[learner_seat]
    opponents = [s for s in squads if s.seat != learner_seat]

    feats = []
    feats += _onehot(config.format, FORMATS)
    feats += _onehot(config.scope_type, SCOPES)
    feats += _onehot(config.constraint, CONSTRAINTS)
    feats += _onehot(decision.kind, DECISIONS)
    feats += [config.lobby_size / 5.0, len(opponents) / 4.0]
    feats += [1.0 if squad.slots[slot] is not None else 0.0 for slot in FORMATION_SLOTS]
    feats += [squad.total_ability() / (11 * MAX_ABILITY)]

    if opponents:
        feats += [sum(o.total_ability() for o in opponents) / len(opponents) / (11 * MAX_ABILITY)]
        feats += [sum(len(o.open_slots()) for o in opponents) / len(opponents) / 11.0]
    else:
        feats += [0.0, 0.0]

    if config.format == Format.AUCTION and budget_total > 0:
        feats += [squad.budget_remaining / budget_total]
    else:
        feats += [1.0]

    ctx = decision.context
    extra = [0.0, 0.0, 0.0]
    if decision.kind == DecisionKind.BID:
        extra[0] = ctx["current_price"] / max(budget_total, 1.0)
        extra[1] = squad.budget_remaining / max(budget_total, 1.0)
    elif decision.kind == DecisionKind.STICK_OR_HEAR:
        extra[0] = ctx["revealed"].ability / MAX_ABILITY
    elif decision.kind == DecisionKind.TAKE_OR_GOBACK:
        extra[0] = ctx["offer"].ability / MAX_ABILITY
        extra[1] = ctx["remaining_unopened_avg_ability"] / MAX_ABILITY
        extra[2] = ctx["remaining_unopened_count"] / 10.0
    feats += extra

    assert len(feats) == GLOBAL_DIM, f"observation drift: built {len(feats)} feats, expected {GLOBAL_DIM}"
    return torch.tensor(feats, dtype=torch.float32)


def encode_candidate(player) -> torch.Tensor:
    feats = [1.0 if pos in player.positions else 0.0 for pos in POSITIONS]
    feats += [player.ability / MAX_ABILITY, player.age / 40.0]
    return torch.tensor(feats, dtype=torch.float32)


def encode_candidates(candidates: list) -> torch.Tensor:
    if not candidates:
        return torch.zeros((0, CANDIDATE_DIM), dtype=torch.float32)
    return torch.stack([encode_candidate(p) for p in candidates])
