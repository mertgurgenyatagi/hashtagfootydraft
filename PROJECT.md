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

**Open:** what happens when a player runs out of money / has very little left; how the
footballer pool is selected so all positions are covered; how footballers are chosen
for the pool in general.

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

Same **graveyard** mechanic as Auction.

**Open:** same as Auction — running out of money/low money, pool selection for
position coverage, general footballer selection.

#### Free Pick
3 example players: John, Paul, Ringo. Straight **snake draft**, 11 picks total, each
player freely picking any footballer in the pool on their turn. **No graveyard.**

#### Spin the Wheel
Mechanic depends on Scope (not fully decided yet):
- Scope = Top 5 Leagues → spin a wheel of clubs, leagues, or nationalities, then free
  pick in a snake draft.
- Scope = one specific league → spin a wheel of clubs or nationalities, then free pick
  in a snake draft.

The wheel is spun before every pick.

**Open:** exact wheel mechanics/weighting, full interaction with each Scope option.

### Scope
Four values: **All players**, **Top 5 leagues**, **one specific league**, **one
specific nationality**.

### Constraints
Four possible values: **1 per club**, **3 per club**, **1 per nationality**, **3 per
nationality**.

## Player Data

`player_data.csv` is the footballer pool: name, nation, age, club, position(s),
current ability, league. Covers the top 5 leagues (Premier Division, Serie A, First
Division, Bundesliga, Ligue 1) plus a number of high-ability players from other leagues
(Saudi Pro League, MLS, Eredivisie, Sky Bet Championship, etc.).

## Open Questions Log

Tracked and resolved via the questionnaire process — see `questionnaire_1.md` onward.
Each entry below is closed out (with the decision folded into the rules above) once its
questionnaire is answered.

1. Auction / Deal or No Deal: what happens when a player runs out of money or is very
   low on funds?
2. How is the footballer pool selected per draft so all positions are covered?
3. How are footballers chosen for the pool in general (beyond position coverage)?
4. Spin the Wheel: exact mechanics, especially interaction with each Scope value.
5. AI bots: game-facing behavior rules (not implementation) — how they bid, pick,
   accept/decline offers, etc.

## Questionnaire Log

| # | Topic | Status |
|---|-------|--------|
| 1 | TBD | Pending |
| 2 | TBD | Not started |
| 3 | TBD | Not started |
| 4 | TBD | Not started |
| 5 | TBD | Not started |
| 6 | TBD | Not started |
| 7 | TBD | Not started |
| 8 | TBD | Not started |
| 9 | TBD | Not started |
| 10 | TBD | Not started |
