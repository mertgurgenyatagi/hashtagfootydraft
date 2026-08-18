# Bot Questionnaire 3 — Answers & Settled Decisions

**Date:** 2026-08-18  
**Topic:** Reinforcement Learning Algorithm, Observation Representations, Champion Checkpointing, and Training Volume

---

### Q01: Which Reinforcement Learning algorithm should we use for self-play training?
- **Decision:** PPO (Proximal Policy Optimization) / Actor-Critic (Option A).
- **Details:** Use multi-agent PPO with an Actor-Critic architecture for stable policy gradient updates on discrete action spaces during self-play.

---

### Q02: In Auction self-play, what state information does the bot observe on its turn?
- **Decision:** Comprehensive bidding state (Option A).
- **Details:** Features include:
  1. **Active player info:** Position one-hot, Current Ability (scaled), Opening Bid (scaled), Current High Bid (scaled).
  2. **Bot's own state:** 11-slot formation occupancy vector, current XI total score, and remaining budget (scaled).
  3. **Opponents' state:** Vector of all opponents' remaining budgets and remaining unfilled position slots.
  4. **Global state:** Count of unsold/remaining players left in pool.

---

### Q03: In Free Pick & Spin the Wheel, how should available candidate players be input into the network?
- **Decision:** Full pool embedding matrix with legal action mask (Option B).
- **Details:** A fixed-size feature matrix representing all 546 pool players (ability, position, club, league) combined with a boolean availability mask filtering out unavailable or constraint-violating players.

---

### Q04: In Deal or No Deal, what state does the bot observe?
- **Decision:** Round & box statistics (Option A).
- **Details:** Features include:
  1. Active position & multiplier.
  2. Currently opened box player ability.
  3. Remaining unopened box count & exact average ability.
  4. Expected AI Banker offer player ability (`Average − 15.0`).
  5. Bot's current 11-slot formation status.

---

### Q05: In Auction, how should the bot manage graveyard vs starting XI slotting?
- **Decision:** Automatic optimal placement (Option A).
- **Details:** The engine automatically places the highest-ability player into the starting XI slot, pushing any lower-rated player into the graveyard overflow.

---

### Q06: What happens if a bot cannot afford a raise (+5M, +10M, +25M) in Auction?
- **Decision:** Action masking (Option A).
- **Details:** Any bid button that exceeds remaining budget is masked with $-\infty$ logits so the model can only choose legal affordable raises or `Pass (0)`.

---

### Q07: How many self-play draft games should we train per format?
- **Decision:** 500,000+ drafts (Option C).
- **Details:** Deep self-play training run (500k+ simulated drafts per format) to ensure robust convergence.

---

### Q08: How should we evaluate bot performance after training?
- **Decision:** Champion vs Challenger Checkpoint League.
- **Details:** Pure self-play evaluation. Checkpoints are saved periodically during training. The latest model is pitted against the current reigning "Champion" checkpoint over a series of matches. If the win margin is negligible or the Champion cannot be beaten across a prolonged training window, the model is declared converged and training completes.

---

### Q09: Should bots have slight decision variety (temperature) when playing against humans?
- **Decision:** Softmax sampling with Temperature ~0.6 (Option A).
- **Details:** High-probability action selection with controlled temperature to provide natural decision variation across games while maintaining high competitive skill.

---

### Q10: Where should training scripts and exported model weights live in the repo?
- **Decision:** `scripts/training/` & `src/data/botModels/` (Option A).
- **Details:** Python training pipeline and simulation environments reside in `scripts/training/`. Exported browser-ready weights reside in `src/data/botModels/`.
