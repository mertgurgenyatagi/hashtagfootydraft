# #footydraft — Project Rules

This document is the living source of truth for how the game works. It starts from
`initial_briefing.txt` and gets updated after each questionnaire is answered
(`questionnaire_1.md`, `questionnaire_2.md`, ...) so it always reflects the latest
decisions. Open questions are tracked at the bottom and resolved into the rules above
as answers come in.

## Overview

"#footydraft" is a website where friends draft football players together in various
game formats, scopes and constraints. Bots can be added to lobbies, or a user can play
single player against them. There is no scoring system — squads are simply compared
and can be shared. Lobbies have a persistent chat box.

The formation is always **4-2-3-1**: GK, CB, CB, LB, RB, CDM, CM, AMF, LW, RW, ST. This
is constant and cannot change.

## Hosting / Stack

- Frontend hosted on **GitHub Pages**.
- Backend/data via **Firebase / Firestore** (or whatever Firebase service fits —
  realtime lobby state, auth, etc. TBD as needed).
- AI bots are **machine learning models**. How they're built/trained is out of scope
  for now — this document only covers game rules the bots (and humans) must follow.

## Configuration Mechanics

Every draft is configured along three independent axes: **Format**, **Scope**, and
**Constraints**.

### Formats

#### Auction
3 example players: John, Paul, Ringo. Each starts with a budget (e.g. 1B euros). A
footballer comes up starting at a predetermined starting value (not 0). Players bid in
real time; if no one bids, the footballer is gone. Highest bidder wins and can slot the
footballer anywhere they're eligible in their current 11, and can rearrange their
formation in real time.

Every purchased footballer goes into the buyer's **graveyard** — a holding area of
purchased-but-unused players, not substitutes, not part of the final list. Players
place footballers from their graveyard into their formation as desired. The graveyard
lets a player upgrade their lineup or block opponents from getting certain footballers.
The graveyard is **unlimited** — no cap on how many footballers can sit in it, no extra
cost beyond the winning bid. *(Q7)*

**Running low on money — backfill, not a reserve** *(R1-Q1 → overturned by R2-Q4)*: no
funds are held back during bidding — it stays a genuine free-for-all, anyone can bid
whatever they have at any time. Instead, once the auction **runs its course** (defined
as: every remaining footballer in the pool has been through the block, *or* every
player still short of a full XI can no longer afford any unsold eligible footballer for
their open slots — whichever comes first), any player left with empty slots has them
auto-filled with the **cheapest still-eligible unsold footballers** for those
positions. Running out of money isn't prevented, it's just not punished with a
permanently broken squad — you end up with worse players, not fewer players. This is
also the default behavior when a pick/bid timer expires unattended (see Turns &
Timers). Deal or No Deal has no budget in the briefing, so "running out of money"
doesn't apply there.

There's **no designated opener/nominator** — any footballer can be bid on by anyone the
moment it appears, no rotating turn to bring it up. *(R2-Q5)*

Bid increments are **flat, stepped amounts** (e.g. +1M, +5M, +10M — think eBay-style
bid buttons) rather than a percentage of the current price. *(R2-Q3)* Exact step table
still TBD. How a footballer's *starting* value is set is explicitly deferred — not
needed yet. *(R2-Q2)*

**Open:** how footballers are chosen for the pool in general, beyond guaranteeing
position coverage (Q2 settles coverage; Round 2 settled a quality skew — see Player
Data Pool below); Auction starting-value formula (deferred); exact bid increment
step table.

#### Deal or No Deal
3 example players: John, Paul, Ringo. One position is picked at random (e.g. CDM).
There are `n*2` boxes (6 for 3 players), each containing a footballer eligible for that
position. Players open boxes in turn order and choose to **stick** or **hear the
offer**. After everyone has opened once, an AI proposer offers a player (not in any
box) to each player who chose to hear the offer, based on the quality of the remaining
unopened boxes. Each offered player can **take it** or **go back to the boxes**. If
they go back, the next box they open is the player they must take. Round ends; a new
position is picked at random and the turn order rotates (a different player goes
first).

Same **graveyard** mechanic as Auction (unlimited, no extra cost).

This format has no budget/currency in the briefing — every player is guaranteed a
footballer each round (stick, take the offer, or go back to the boxes), so it's
self-completing by design. *(R1-Q1)*

**Open:** how footballers are chosen for the pool in general, beyond position coverage;
how the AI proposer picks the quality/identity of its offer (a format rule that applies
to every player, human or bot — not the same question as bot personality below, which
is explicitly deferred).

#### Free Pick
3 example players: John, Paul, Ringo. Straight **snake draft**, 11 picks total, each
player freely picking any footballer in the pool on their turn. **No graveyard.**
Self-completing by design (11 picks = 11 slots). First pick order is a **random draw**
at draft start. *(R2-Q6, also applies to Spin the Wheel below)*

#### Spin the Wheel
Mechanic depends on Scope (not fully decided yet):
- Scope = Top 5 Leagues → spin a wheel of clubs, leagues, or nationalities, then free
  pick in a snake draft.
- Scope = one specific league → spin a wheel of clubs or nationalities, then free pick
  in a snake draft.

The wheel is spun before every pick. If the wheel lands on a category with no eligible
footballers left, that turn **falls back to a free pick from the full remaining pool**
— just for that turn, the wheel category isn't removed and play resumes normally next
turn. *(Q4, decided by Claude)*

**Open:** exact wheel weighting/odds, full interaction with each Scope option.

### Scope
Four values: **All players**, **Top 5 leagues**, **one specific league**, **one
specific nationality**.

### Constraints
Four possible values: **1 per club**, **3 per club**, **1 per nationality**, **3 per
nationality**. Exactly **one** constraint is active per draft — they don't stack. *(Q8)*

### Lobby Size
**2–5** drafters (humans + bots combined), no minimum-to-start beyond 2. The size isn't
chosen up front — the lobby leader starts whenever ready and the headcount is whatever
has joined by then. *(R1-Q3, resolved: the earlier "10" was a slip, R2-Q1)*

### Squad Completion Guarantee
A draft can **never** end with an unfilled slot in the 4-2-3-1 — every format must
produce a complete XI. *(R1-Q5)* This is already true by construction for Deal or No
Deal, Free Pick, and Spin the Wheel (each cycles exactly 11 times, one slot per turn).
Auction is the only format that could otherwise leave gaps — it's covered by the
backfill-with-cheapest-eligible-footballers rule above, not by preventing low-money
bidding in the first place.

### Turns & Timers
Host-configurable per-turn/bid timer (a length can be set, or timers can be turned off
entirely). *(R1-Q6)* On timeout, the system defaults to the **least-committal, no-help
option** rather than picking something good on the player's behalf — consistent with
the Auction backfill philosophy (stalling gets you scraps, not a curated pick):
- **Auction:** no special handling needed — bidding just closes without that player's
  input if they don't act.
- **Deal or No Deal:** stick/hear-the-offer defaults to **stick**; take/go-back-to-the-
  boxes defaults to **take the offer**. Both avoid introducing more randomness.
- **Free Pick / Spin the Wheel:** auto-picks the **cheapest eligible remaining
  footballer** for that slot — mirroring the Auction backfill rule. *(R2-Q7, decided by
  Claude; first-pass rule, may get refined later)*

### Bots
Bots always play **one consistent default style** — no personality/aggressiveness
picker exposed to players. *(R1-Q9)* The actual decision logic (how a bot bids,
sticks, takes offers, etc.) is **explicitly deferred** — not to be speced out yet.
*(R2-Q8)*

### Comparing Squads
No numbers, no leaderboard — just a **pure side-by-side visual** of both finished
formations. *(R2-Q9)*

### Player Data Pool
Beyond guaranteeing every position has enough eligible footballers, the pool should
**skew toward higher-ability players** so drafts feel star-studded rather than
strictly representative of the full Scope. *(R2-Q10)*

### Post-Draft Editing
Once a draft ends, the **roster is locked** but players can still rearrange which
already-drafted footballer sits in which formation slot (positioning only, no
swapping/adding footballers). *(Q10)*

## Player Data

`player_data.csv` is the footballer pool: name, nation, age, club, position(s),
current ability, league. Covers the top 5 leagues (Premier Division, Serie A, First
Division, Bundesliga, Ligue 1) plus a number of high-ability players from other leagues
(Saudi Pro League, MLS, Eredivisie, Sky Bet Championship, etc.).

## Open Questions Log

Tracked and resolved via the questionnaire process — see `questionnaire_1.md` onward.
Each entry below is closed out (with the decision folded into the rules above) once its
questionnaire is answered.

~~1. Auction / Deal or No Deal: what happens when a player runs out of money or is very
   low on funds?~~ Resolved R1-Q1, revised R2-Q4: backfill with cheapest eligible
   footballers once the auction runs its course; N/A for Deal or No Deal.
~~2. How is the footballer pool selected per draft so all positions are covered?~~
   Resolved (pool is built position-by-position first, then combined; skewed toward
   higher-ability players per R2-Q10).
3. ~~How are footballers chosen for the pool in general?~~ Resolved R2-Q10 (skew toward
   higher ability). Still open: exact skew curve/weighting.
4. ~~Spin the Wheel: exact mechanics~~ — dry-category fallback resolved; wheel
   weighting/odds and full Scope interaction still open.
5. AI bots: game-facing decision logic is **explicitly deferred by design** — not to be
   speced out yet (R2-Q8). Separately open: how the Deal or No Deal AI proposer chooses
   what to offer (a format rule, not bot personality).
~~6. Lobby size~~ Resolved: 2–5 (R2-Q1).
~~7. Turn/bid timer default behavior~~ Resolved, first pass (R2-Q7). Still open: default
   timer length.
8. Auction: starting bid value formula (explicitly deferred, R2-Q2) and the exact bid
   increment step table (flat/stepped decided, R2-Q3; table itself TBD).
~~9. Turn order~~ Resolved: Auction is a pure free-for-all, no nomination order (R2-Q5);
   Free Pick / Spin the Wheel first pick is a random draw (R2-Q6).
~~10. What does "compare squads" show?~~ Resolved: pure side-by-side visual, no numbers
   (R2-Q9).
11. Precise definition of "the auction has run its course" (first pass written into the
    Auction rules above — may need tightening once implementation starts).
12. Scope × Spin the Wheel: full interaction details still open (which wheel categories
    apply to which Scope, beyond the two examples in the briefing).

## Questionnaire Log

| # | Topic | Status |
|---|-------|--------|
| 1 | Money, pool coverage, lobby size, timers, graveyard, constraints, bots, post-draft editing | Answered — see `questionnaire_1.md` |
| 2 | Lobby size fix, Auction pricing/increments/turn order, timer timeout, D-o-N-D bots, squad comparison, pool quality | Answered — see `questionnaire_2.md` |
| 3 | Auction reveal flow, wheel/scope/graveyard interactions, D-o-N-D offers, sharing, disconnects, single-player, multi-position slotting, bid steps | Pending |
| 4 | TBD | Not started |
| 5 | TBD | Not started |
| 6 | TBD | Not started |
| 7 | TBD | Not started |
| 8 | TBD | Not started |
| 9 | TBD | Not started |
| 10 | TBD | Not started |
