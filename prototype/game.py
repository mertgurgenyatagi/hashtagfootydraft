"""Single-player game session for the #footydraft HTML prototype.

Wraps the existing bot_ai draft engines (which are generators that yield a
PendingDecision per seat) so that seat 0 is a human: bot seats are resolved
immediately using the trained champion checkpoint, and the generator is parked
whenever it's the human's turn. The server just shuttles JSON in and out.
"""

import random
import sys
from pathlib import Path

import torch

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from simulation.models import FORMATION_SLOTS, SLOT_POSITION  # noqa: E402

from bot_ai.bots import GreedyBot, NaiveAuctionBot, NeedAwareBot  # noqa: E402
from bot_ai.env import ENGINES  # noqa: E402
from bot_ai.league import FrozenPolicy  # noqa: E402
from bot_ai.networks import PolicyValueNet  # noqa: E402
from bot_ai.pool_sampling import (  # noqa: E402
    SLOT_POSITIONS,
    _filter_scope,
    _position_depth,
    compute_auction_budget,
    load_players,
    sample_pool,
)
from bot_ai.squad import Squad  # noqa: E402
from bot_ai.types import (  # noqa: E402
    TOP5_LEAGUES,
    Constraint,
    DecisionKind,
    EpisodeConfig,
    Format,
    ScopeType,
)
from bot_ai.auction_engine import INCREMENTS  # noqa: E402
from bot_ai.wheel_engine import _ATTR, eligible_wheel_categories  # noqa: E402

HUMAN_SEAT = 0
CHECKPOINT = ROOT / "checkpoints" / "champion.pt"
CSV_PATH = ROOT / "player_data.csv"

FORMAT_LABELS = {
    Format.AUCTION: "Auction",
    Format.DEAL_OR_NO_DEAL: "Deal or No Deal",
    Format.FREE_PICK: "Free Pick",
    Format.SPIN_THE_WHEEL: "Spin the Wheel",
}
CONSTRAINT_LABELS = {
    Constraint.NONE: "None",
    Constraint.ONE_PER_CLUB: "1 per club",
    Constraint.THREE_PER_CLUB: "3 per club",
    Constraint.ONE_PER_NATIONALITY: "1 per nationality",
    Constraint.THREE_PER_NATIONALITY: "3 per nationality",
}


def player_json(p):
    if p is None:
        return None
    return {
        "name": p.name,
        "nation": p.nation,
        "age": p.age,
        "club": p.club,
        "positions": list(p.positions),
        "ability": p.ability,
        "league": p.league,
        "price": p.derived_price,
        "opening": p.opening_bid,
    }


def _playable(players: list, lobby_size: int, fmt: Format) -> bool:
    """Can a draft of this size actually finish inside this scope?

    Deliberately looser than pool_sampling._meets_depth, which builds in 3-6x headroom
    so a long unattended training run can never crash. That headroom rejects nearly
    every scope for a human: only 10 footballers in the whole dataset list CM, so 3x a
    5-player lobby already fails on "All players". This checks the true floor instead --
    one eligible footballer per drafter per slot, and 2 per drafter per Deal or No Deal
    round, since each round boxes 2n of them (CB doubled, it gets two rounds)."""
    depth = _position_depth(players)
    for pos in SLOT_POSITIONS:
        need = lobby_size * (2 if fmt == Format.DEAL_OR_NO_DEAL else 1)
        if pos == "CB":
            need *= 2
        if depth[pos] < need:
            return False
    return True


class Catalogue:
    """The full player list plus scope-feasibility answers for the setup screen."""

    def __init__(self):
        self.players = load_players(str(CSV_PATH))
        self.leagues = sorted({p.league for p in self.players if p.league and p.league != "-"})
        self.nations = sorted({p.nation for p in self.players})
        self._cache = {}

    def feasible_scopes(self, fmt: Format, lobby_size: int) -> dict:
        key = (fmt, lobby_size)
        if key in self._cache:
            return self._cache[key]

        def ok(scope_type, scope_value):
            return _playable(_filter_scope(self.players, scope_type, scope_value), lobby_size, fmt)

        result = {
            "all": ok(ScopeType.ALL, None),
            "top5": ok(ScopeType.TOP5, None),
            "leagues": [lg for lg in self.leagues if ok(ScopeType.LEAGUE, lg)],
            "nations": [n for n in self.nations if ok(ScopeType.NATIONALITY, n)],
        }
        self._cache[key] = result
        return result


def load_champion(device):
    if not CHECKPOINT.exists():
        return None, 0
    state = torch.load(CHECKPOINT, map_location=device)
    net = PolicyValueNet().to(device)
    net.load_state_dict(state["model"])
    net.eval()
    return net, state.get("version", 0)


class Game:
    def __init__(self, catalogue: Catalogue, opts: dict, champion=None, champion_version=0, device="cpu"):
        fmt = Format(opts["format"])
        scope_type = ScopeType(opts.get("scope_type") or "all")
        scope_value = opts.get("scope_value") or None
        lobby_size = max(2, min(5, int(opts.get("lobby_size", 3))))
        constraint = (
            Constraint(opts.get("constraint") or "none") if fmt == Format.FREE_PICK else Constraint.NONE
        )
        seed = int(opts.get("seed") or random.randrange(2 ** 31))

        self.rng = random.Random(seed)
        scope_players = _filter_scope(catalogue.players, scope_type, scope_value)
        self.pool = sample_pool(self.rng, scope_players, lobby_size, fmt)

        self.budget = 0.0
        if fmt == Format.AUCTION:
            raw = opts.get("budget", "auto") or "auto"
            self.budget = compute_auction_budget(self.pool) if raw == "auto" else float(raw)

        self.config = EpisodeConfig(
            format=fmt, scope_type=scope_type, scope_value=scope_value,
            constraint=constraint, lobby_size=lobby_size, seed=seed,
        )
        self.squads = [
            Squad(seat=i, budget_total=self.budget, budget_remaining=self.budget)
            for i in range(lobby_size)
        ]

        if champion is not None:
            self.bots = {i: FrozenPolicy(champion, device) for i in range(1, lobby_size)}
            self.bot_source = f"champion.pt (v{champion_version})"
        else:
            roster = [GreedyBot(self.rng), NeedAwareBot(self.rng), NaiveAuctionBot(self.rng)]
            self.bots = {i: roster[(i - 1) % len(roster)] for i in range(1, lobby_size)}
            self.bot_source = "heuristic bots (no checkpoint found)"

        self.log = []
        self.done = False
        self.pending = None
        self.auction_leader = None
        self._auction_current = None
        self._wheel_category = None

        self._push(None, f"{FORMAT_LABELS[fmt]} draft started — {lobby_size} drafters, "
                         f"{len(self.pool)} footballers in the pool.")

        gen = ENGINES[fmt](self.pool, self.squads, self.config, self.rng)
        self.gen = gen.run()
        self._pump(None)

    # ---------------------------------------------------------------- driving

    def _seat_name(self, seat):
        return "You" if seat == HUMAN_SEAT else f"Bot {seat}"

    def _push(self, seat, text):
        self.log.append({"seat": seat, "text": text})
        del self.log[:-400]

    def _snapshot(self):
        return [(dict(s.slots), len(s.graveyard), s.budget_remaining) for s in self.squads]

    def _diff(self, before):
        for squad, (slots, grave_len, budget) in zip(self.squads, before):
            paid = budget - squad.budget_remaining
            for slot in FORMATION_SLOTS:
                was, now = slots[slot], squad.slots[slot]
                if now is not None and now is not was:
                    cost = f" for €{paid:.0f}m" if paid > 0 else ""
                    self._push(squad.seat, f"{self._seat_name(squad.seat)} → {now.name} ({slot}){cost}")
            for extra in squad.graveyard[grave_len:]:
                cost = f" for €{paid:.0f}m" if paid > 0 else ""
                self._push(squad.seat, f"{self._seat_name(squad.seat)} → {extra.name} (graveyard){cost}")

    def _send(self, action):
        before = self._snapshot()
        try:
            decision = self.gen.send(action)
        except StopIteration:
            decision = None
        self._diff(before)
        return decision

    def _bid_costs(self, price):
        if self.auction_leader is None:
            return [0.0, price, price, price]
        return [0.0, price + INCREMENTS[0], price + INCREMENTS[1], price + INCREMENTS[2]]

    def _observe(self, decision):
        """Track auction bookkeeping the engine keeps privately (who's leading, and
        when a new footballer comes up) so the UI and log can show it."""
        if decision is None:
            return
        if decision.kind == DecisionKind.PICK:
            self._wheel_category = decision.context.get("category") or self._wheel_category
            return
        if decision.kind != DecisionKind.BID:
            return
        footballer = decision.context["footballer"]
        if footballer is not self._auction_current:
            self._auction_current = footballer
            self.auction_leader = None
            self._push(None, f"⚑ Up next: {footballer.name} — opening €{footballer.opening_bid:.0f}m")

    def _record_bid(self, decision, action):
        if decision.kind != DecisionKind.BID or action == 0:
            return
        price = self._bid_costs(decision.context["current_price"])[action]
        self.auction_leader = decision.seat
        self._push(decision.seat, f"{self._seat_name(decision.seat)} bids €{price:.0f}m")

    def _pump(self, action):
        decision = self._send(action)
        while decision is not None and decision.seat != HUMAN_SEAT:
            self._observe(decision)
            bot_action = self.bots[decision.seat].act(decision, self)
            self._record_bid(decision, bot_action)
            self._log_choice(decision, bot_action)
            decision = self._send(bot_action)
        self._observe(decision)
        self.pending = decision
        if decision is None:
            self.done = True
            self._push(None, "Draft complete.")

    def _log_choice(self, decision, action):
        seat = decision.seat
        if decision.kind == DecisionKind.STICK_OR_HEAR:
            revealed = decision.context["revealed"]
            what = f"sticks with {revealed.name}" if action == 0 else f"passes on {revealed.name} to hear the offer"
            self._push(seat, f"{self._seat_name(seat)} {what}")
        elif decision.kind == DecisionKind.TAKE_OR_GOBACK:
            offer = decision.context["offer"]
            what = f"takes the offer ({offer.name})" if action == 0 else "goes back to the boxes"
            self._push(seat, f"{self._seat_name(seat)} {what}")

    # ----------------------------------------------------------------- action

    def default_action(self, decision):
        """Timer-expiry behaviour: least-committal option (PROJECT.md, Turns & Timers)."""
        if decision.kind == DecisionKind.PICK:
            return min(range(len(decision.candidates)), key=lambda i: decision.candidates[i].opening_bid)
        return 0

    def apply(self, action):
        if self.done or self.pending is None:
            return
        decision = self.pending
        if action is None:
            action = self.default_action(decision)
            self._push(HUMAN_SEAT, "Timer expired — default option taken.")
        action = int(action)

        if decision.kind == DecisionKind.PICK:
            action = max(0, min(action, len(decision.candidates) - 1))
        elif decision.kind == DecisionKind.BID:
            if not decision.context["legal_mask"][action]:
                action = 0
            self._record_bid(decision, action)
            if action == 0:
                self._push(HUMAN_SEAT, "You pass")
        else:
            action = 0 if action == 0 else 1
        self._log_choice(decision, action)
        self._pump(action)

    # ------------------------------------------------------- squad rearranging

    def can_rearrange(self):
        # Deal or No Deal writes each round's result straight into that round's slot,
        # so shuffling slots mid-draft there would silently overwrite a footballer.
        return self.done or self.config.format == Format.AUCTION

    def move(self, src, dst):
        if not self.can_rearrange():
            return "Rearranging isn't available in this format until the draft ends."
        squad = self.squads[HUMAN_SEAT]

        def get(ref):
            if ref["type"] == "slot":
                return squad.slots.get(ref["key"])
            idx = int(ref["key"])
            return squad.graveyard[idx] if 0 <= idx < len(squad.graveyard) else None

        a, b = get(src), get(dst)
        if a is None and b is None:
            return "Nothing to move."
        for ref, player in ((dst, a), (src, b)):
            if ref["type"] == "slot" and player is not None:
                if SLOT_POSITION[ref["key"]] not in player.positions:
                    return f"{player.name} can't play {SLOT_POSITION[ref['key']]}."

        def clear(ref):
            if ref["type"] == "slot":
                squad.slots[ref["key"]] = None

        removals = sorted(
            [int(r["key"]) for r in (src, dst) if r["type"] == "grave"], reverse=True
        )
        clear(src)
        clear(dst)
        for idx in removals:
            squad.graveyard.pop(idx)

        for ref, player in ((dst, a), (src, b)):
            if player is None:
                continue
            if ref["type"] == "slot":
                squad.slots[ref["key"]] = player
            else:
                squad.graveyard.append(player)
        return None

    # ------------------------------------------------------------------ state

    def _pending_json(self):
        d = self.pending
        if d is None:
            return None
        out = {"kind": d.kind.value, "seat": d.seat}
        if d.kind == DecisionKind.BID:
            price = d.context["current_price"]
            out.update({
                "footballer": player_json(d.context["footballer"]),
                "price": price,
                "costs": self._bid_costs(price),
                "legal": d.context["legal_mask"],
                "leader": self.auction_leader,
                "leader_name": None if self.auction_leader is None else self._seat_name(self.auction_leader),
            })
        elif d.kind == DecisionKind.STICK_OR_HEAR:
            out.update({
                "revealed": player_json(d.context["revealed"]),
                "position": d.context["position"],
            })
        elif d.kind == DecisionKind.TAKE_OR_GOBACK:
            out.update({
                "offer": player_json(d.context["offer"]),
                "boxes_avg": d.context["remaining_unopened_avg_ability"],
                "boxes_left": d.context["remaining_unopened_count"],
            })
        else:
            out["candidates"] = [player_json(p) for p in d.candidates]
            category = d.context.get("category")
            if category:
                attr = _ATTR[category]
                values = {getattr(p, attr) for p in d.candidates}
                out["category"] = category
                out["spin"] = values.pop() if len(values) == 1 else None
        return out

    def state(self):
        cfg = self.config
        scope = {
            ScopeType.ALL: "All players",
            ScopeType.TOP5: "Top 5 leagues",
        }.get(cfg.scope_type, cfg.scope_value)
        return {
            "started": True,
            "done": self.done,
            "human_seat": HUMAN_SEAT,
            "format": cfg.format.value,
            "format_label": FORMAT_LABELS[cfg.format],
            "scope": scope,
            "constraint": CONSTRAINT_LABELS[cfg.constraint],
            "lobby_size": cfg.lobby_size,
            "budget_total": self.budget,
            "pool_size": len(self.pool),
            "bot_source": self.bot_source,
            "can_rearrange": self.can_rearrange(),
            "wheel_category": self._wheel_category,
            "squads": [
                {
                    "seat": s.seat,
                    "name": self._seat_name(s.seat),
                    "is_human": s.seat == HUMAN_SEAT,
                    "budget_remaining": s.budget_remaining,
                    "slots": {slot: player_json(p) for slot, p in s.slots.items()},
                    "graveyard": [player_json(p) for p in s.graveyard],
                    "filled": 11 - len(s.open_slots()),
                    "avg_ability": (s.total_ability() / 11.0),
                }
                for s in self.squads
            ],
            "pending": self._pending_json(),
            "log": self.log[-200:],
        }


def setup_options(catalogue: Catalogue):
    return {
        "formats": [{"value": f.value, "label": FORMAT_LABELS[f]} for f in Format],
        "constraints": [{"value": c.value, "label": CONSTRAINT_LABELS[c]} for c in Constraint],
        "slots": FORMATION_SLOTS,
        "slot_position": SLOT_POSITION,
        "top5": list(TOP5_LEAGUES),
        "wheel_categories": {
            st.value: eligible_wheel_categories(st) for st in ScopeType
        },
    }
