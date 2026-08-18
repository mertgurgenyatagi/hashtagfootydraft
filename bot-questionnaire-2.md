# Bot Questionnaire 2 — Answers & Settled Decisions

**Date:** 2026-08-18  
**Topic:** Bot Machine Learning Training Architecture, Action Spaces, Auction Buttons, and Banker Discount

---

### Q01: Should we train separate AI models for each game format?
- **Decision:** Separate models per format (Option A).
- **Details:** Train dedicated, lightweight neural network models tailored specifically for each format's distinct decision structure (Auction, Deal or No Deal, Free Pick, Spin the Wheel).

---

### Q02: In self-play RL, how should the end-of-draft reward be calculated?
- **Decision:** Relative margin over lobby average (Option A).
- **Details:** `Reward = (Bot's Squad Score − Lobby Average Squad Score)`. This motivates the agent to draft the best possible 11 while outscoring the competition at the table.

---

### Q03: In Auction self-play, what discrete actions can a bot choose?
- **Decision:** Pass or raise by `+5M`, `+10M`, or `+25M`.
- **Details:** Actions are `Pass (0)`, `+5M`, `+10M`, and `+25M`. These values also define the official auction bid buttons on the game screen (superseding the earlier +1/+5/+10 placeholder).

---

### Q04: In Auction, does graveyard overflow count for anything in the final score?
- **Decision:** Starting XI only (Graveyard = 0 points) (Option A).
- **Details:** The agent evaluates its squad strictly based on its best legal 11 starting players slotted into the 4-2-3-1. Graveyard overflow buys score zero additional points.

---

### Q05: In Deal or No Deal, what decisions does the bot make each round?
- **Decision:** Two-step decision (Option A).
- **Details:**
  1. **Step 1:** Pick an unopened box, then choose `Stick` or `Hear Offer`.
  2. **Step 2 (if hearing offer):** Choose `Take Offer` or `Open 2nd Box`.

---

### Q06: In Deal or No Deal, how should the Banker discount the offer?
- **Decision:** Flat deduction of **−15 Ability rating**.
- **Details:** The AI Banker offers an available undrafted pool player matching that round's position whose Current Ability is closest to `(Average of remaining unopened boxes − 15.0)`.

---

### Q07: In Free Pick & Spin the Wheel, how should the bot select from legal players?
- **Decision:** Pure ML policy / No handholding.
- **Details:** No hardcoded greedy heuristics or artificial position rankings. The policy network learns directly from self-play state observations (open slots, remaining pool, draft pick order).

---

### Q08: What lobby sizes should bots be trained against during ML self-play?
- **Decision:** Randomized 2–5 drafter tables (Option A).
- **Details:** Sample lobby sizes uniformly or across 2, 3, 4, and 5 seats so agents generalize to both 1v1 heads-up and full 5-player drafts.

---

### Q09: Which Scope should be the initial training ground for the bots?
- **Decision:** Randomized across scopes with weighted distribution.
- **Details:** Training samples scopes with realistic weightings:
  - **All Players (546):** ~50%
  - **Top 5 Leagues (463):** ~30%
  - **Single Leagues (Premier Division, Serie A, First Division, Bundesliga):** ~20%

---

### Q10: How should the trained bot models be executed on the website?
- **Decision:** In-browser lightweight weights (ONNX / JS) (Option A).
- **Details:** The trained policy networks will be exported to compact ONNX or pure JavaScript weights that run client-side in the browser on GitHub Pages with zero backend dependency and instant inference.
