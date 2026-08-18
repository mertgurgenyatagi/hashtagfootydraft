# Bot Questionnaire 1 — Answers & Settled Decisions

**Date:** 2026-08-18  
**Topic:** Core Draft Rules Clarification, Edge Cases, Auction Timers, and Bot ML Optimization Metric

---

### Settled Starting Rule: Auction Budget Formula
- **Rule:** Budget = **(Average Derived Price of all players in selected pool) × 20**, rounded to the nearest **100M EUR**.

---

### Q01: What happens if a player gets stuck in Free Pick? (Constraint Deadlock)
- **Decision:** Do nothing — the game simply stays stuck.
- **Details:** Viability simulation already filters out configurations prone to deadlocks in the lobby. If a player drafts themselves into a deadlock in an active game, the system does not inject artificial bailouts or constraint auto-waivers.

---

### Q02: Can you change your squad after Free Pick, Spin the Wheel, or Deal or No Deal?
- **Decision:** Permanently locked (Option A).
- **Details:** Squads are 100% final the moment the 11th pick completes. No post-draft swapping, free agency, or player trading exists for these three formats. (Only Auction retains post-draft graveyard swapping).

---

### Q03: What happens when someone bids at the last second in an Auction? (Auction Timer Mechanics)
- **Decision:** Reset to full timer on every bid.
- **Details:** The turn timer represents the maximum inactivity duration allowed without a bid. Any valid bid resets the countdown back to the full duration (e.g. 15s or 20s). The player sells only when the full timer runs out with zero new bids. During AI/ML training, there is no real-time clock.

---

### Q04: What happens to a player if nobody bids on them in an Auction?
- **Decision:** Discarded / Unsold pile.
- **Details:** Unsold players are set aside and are not brought back for active bidding. They are only surfaced for the end-of-auction backfill if the pool runs out of other viable players for unfilled slots.

---

### Q05: In Deal or No Deal, where does the "Banker" offer player come from?
- **Decision:** Real player for that position from the undrafted pool (Option A).
- **Details:** Sourced from the remaining undrafted pool matching the round's designated position, with an ability rating deliberately slightly lower than the average of the remaining unopened boxes in that round.

---

### Q06: In Deal or No Deal, what happens to unopened or rejected boxes?
- **Decision:** Returned to the general pool (Option A).
- **Details:** Returned to the undrafted pool. Since rounds progress through positions strictly (with only CB occurring twice in the 4-2-3-1), only CB players can ever be redrawn in a later round.

---

### Q07: In Spin the Wheel, how big should each slice on the wheel be?
- **Decision:** Equal slices for all active options (Option A).
- **Details:** Equal slice proportions for all clubs, leagues, or nations that still have at least 1 legal player available for the active drafter's open positions.

---

### Q08: What should bots prioritize when building their squad? (Squad Valuation Metric)
- **Decision:** Position-Weighted Ability Sum.
- **Details:** Each starting XI player's Current Ability is multiplied by their position weight, and the sum of all 11 players forms the final squad score:
  - **ST:** `1.0846`
  - **AMF / CAM:** `1.0624`
  - **CM:** `1.0612`
  - **RW:** `1.0342`
  - **LW:** `1.0322`
  - **CDM:** `0.9827`
  - **RB:** `0.9760`
  - **LB:** `0.9750`
  - **CB:** `0.9730` (each CB)
  - **GK:** `0.8358`

---

### Q09: How should bots manage their money in Auctions?
- **Decision:** Pure Machine Learning / Reinforcement Learning (no hardcoded heuristics).
- **Details:** No artificial handholding or fixed budget-per-position caps. The AI agents will learn bidding strategies, value valuation, and bankroll management directly through ML / RL self-play against the reward signal.

---

### Q10: How fast should bots make their moves in live games?
- **Decision:** Natural human delay (Option A).
- **Details:** In live interactive lobbies with human players, bots deliberate with a natural delay (1.5 to 3.5 seconds) on picks/offers, and bid with human-like rhythm during auctions. In training/simulation, moves execute instantly without timers.
