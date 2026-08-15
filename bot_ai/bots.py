import random

from .types import DecisionKind, PendingDecision


class GreedyBot:
    """Always takes the highest-ability legal option; bids up to its means."""

    def __init__(self, rng: random.Random):
        self.rng = rng

    def act(self, decision: PendingDecision, env=None) -> int:
        if decision.kind == DecisionKind.PICK:
            return max(range(len(decision.candidates)), key=lambda i: decision.candidates[i].ability)
        if decision.kind == DecisionKind.BID:
            mask = decision.context["legal_mask"]
            for i in (3, 2, 1):
                if mask[i]:
                    return i
            return 0
        if decision.kind == DecisionKind.STICK_OR_HEAR:
            return 0 if decision.context["revealed"].ability >= 155 else 1
        if decision.kind == DecisionKind.TAKE_OR_GOBACK:
            return 0 if decision.context["offer"].ability >= 155 else 1
        raise ValueError(decision.kind)


class RandomLegalBot:
    """Uniformly random among legal options -- pure noise, for opponent diversity."""

    def __init__(self, rng: random.Random):
        self.rng = rng

    def act(self, decision: PendingDecision, env=None) -> int:
        if decision.kind == DecisionKind.PICK:
            return self.rng.randrange(len(decision.candidates))
        if decision.kind == DecisionKind.BID:
            legal = [i for i, ok in enumerate(decision.context["legal_mask"]) if ok]
            return self.rng.choice(legal)
        return self.rng.randrange(2)


class NaiveAuctionBot:
    """Mirrors simulation.bidder.naive_bid_round's probabilistic raising, reused here
    as one of the training league's predetermined opponents rather than just for
    pricing simulations."""

    BID_PROBABILITY = 0.35

    def __init__(self, rng: random.Random):
        self.rng = rng

    def act(self, decision: PendingDecision, env=None) -> int:
        if decision.kind == DecisionKind.BID:
            mask = decision.context["legal_mask"]
            legal_raises = [i for i in (1, 2, 3) if mask[i]]
            if legal_raises and self.rng.random() < self.BID_PROBABILITY:
                return self.rng.choice(legal_raises)
            return 0
        if decision.kind == DecisionKind.PICK:
            return self.rng.randrange(len(decision.candidates))
        return self.rng.randrange(2)


class NeedAwareBot:
    """Favors sticking/taking offers more often than not, with mild randomness --
    a cautious, need-driven counterpart to GreedyBot's pure ability-maxing."""

    def __init__(self, rng: random.Random):
        self.rng = rng

    def act(self, decision: PendingDecision, env=None) -> int:
        if decision.kind == DecisionKind.PICK:
            return max(range(len(decision.candidates)), key=lambda i: decision.candidates[i].ability + self.rng.random() * 5)
        if decision.kind == DecisionKind.BID:
            mask = decision.context["legal_mask"]
            if mask[1] and self.rng.random() < 0.5:
                return 1
            return 0
        if decision.kind == DecisionKind.STICK_OR_HEAR:
            return 0 if self.rng.random() < 0.6 else 1
        if decision.kind == DecisionKind.TAKE_OR_GOBACK:
            return 0 if self.rng.random() < 0.5 else 1
        raise ValueError(decision.kind)


def make_bot_roster(rng: random.Random) -> list:
    return [GreedyBot(rng), RandomLegalBot(rng), NaiveAuctionBot(rng), NeedAwareBot(rng)]
