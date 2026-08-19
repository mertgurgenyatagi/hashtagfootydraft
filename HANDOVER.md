# Project Handover Document

**Last updated:** 2026-08-19 (second update, after the design session), on the
`auction-training` branch.

## Current Status

Reinforcement Learning training is complete for three of the four draft formats:

- **Deal or No Deal**
- **Spin the Wheel**
- **Free Pick**

They were trained with a custom Python PPO implementation and exported as lightweight
JSON weights into `src/data/botModels/` for zero-dependency execution directly in the
browser via TypeScript. These three are **final and complete**.

**The Auction format has no trained model.** Building its training pipeline from scratch
is the outstanding task.

**The design for that pipeline is now complete and approved.** It lives in
`docs/superpowers/specs/2026-08-19-auction-training-pipeline-design.md`. That document
is the authority on what to build — this file is context, the spec is the instruction.
The outstanding work is writing an implementation plan from it and then executing it.
Nothing has been implemented yet; no code was written in the design session.

## Architecture for the Completed Formats

- **Model Architecture:** simple multi-layer perceptron (MLP) policies defined in
  `scripts/training/models.py`.
- **State Representation:** features concatenated into a flat vector (one-hot positions,
  player abilities, current squad needs, etc.).
- **Inference:** the frontend performs the matrix multiplications from the exported JSON
  weights and picks the highest-probability action.

## What Survives in `scripts/training/`

Only shared infrastructure. Everything format-specific was wiped.

| File | What it gives you |
|---|---|
| `config.py` | Paths, formation slots, position multipliers, bid increments, PPO hyperparameters, scope weights, and the **Auction lot cap constants** added 2026-08-19. |
| `player_pool.py` | Loads the 546-player CSV into vectorized arrays. Implements the budget formula, scope masks, `calculate_squad_score`, and `get_optimal_squad_from_roster` (optimal slotting with graveyard overflow). Solid, reusable. |
| `models.py` | Actor-critic networks for all four formats, including `AuctionPolicyNetwork`. |
| `export_weights.py` | Converts `champion.pt` checkpoints into frontend JSON (and attempts ONNX). |
| `live_config.json` | Mid-run hyperparameter overrides, read by `config.get_live_config()`. |
| `metrics/`, `static/dashboard.html` | Metrics JSON and a training dashboard. |
| `checkpoints/` | `dond/`, `free_pick/`, `spin_wheel/` only. **No `auction/`.** |

**Wiped, for every format — not just Auction:** `env_*.py`, `ppo.py`,
`checkpoint_league.py`, and all four `train_*.py`. There is no working training loop in
the repo to imitate. The only trace is `__pycache__/*.pyc`, which can be inspected with
`marshal.load` if you want to see what the old code did without running it.

## Forensics on the Failed Auction Run (2026-08-19)

Three days of attempts produced an auction trainer that was slow and would not improve.
Disassembling the wiped `env_auction.cpython-313.pyc` found the cause, and it was a
**missing game rule rather than a hyperparameter problem**:

- `reset()` built the lot queue as `list(np.random.permutation(scope_indices))` — the
  **entire scoped pool**, with nothing capping it. An All Players draft auctioned all
  **546** footballers; Top 5 auctioned 463.
- `_check_auction_ended()` stopped only when that queue emptied, or when every drafter
  holding an empty slot had **under 5M** left. It never checked whether they could afford
  an *eligible* footballer for their open slots — merely that they had 5M to their name.
- Budgets make that second condition almost unreachable. A drafter can complete a legal
  XI for **220M** out of a **900M** budget, so one drafter sitting on an unfilled thin
  slot with money left — near-universal, since GK/LB/RB depth is low and reveal order is
  random — kept the queue running to the final lot.

The result: every draft was effectively a 546-lot auction. Each lot is a bidding loop
over up to 5 seats, so the floor was roughly **2,730 policy decisions per episode**
against Free Pick's 55 — a **50–100× longer episode carrying a single terminal reward**.
That is both the throughput problem and the credit-assignment problem. Most of those
steps were noise: bidding on lot 400 when the XI filled at lot 90.

Measured: Auction ran at **4.4–7.0 drafts/sec** and had completed **5,634 drafts** when
it was stopped, against 10–15 drafts/sec for the other three formats.

## The Rule That Came Out Of It

**The auction lot list is capped at 15 × lobby size** (settled 2026-08-19). At most
`15 × N` footballers go on the block for an `N`-drafter table: 30 lots at 2 drafters, 75
at 5. This is a **game rule**, not a training shortcut — a 546-lot auction at a 15s bid
timer was never playable by humans either. The training environment inherits it.

The list is built position-by-position first (`N` per single-occupancy slot, `2N` for CB
= `11N`), with the remaining `4N` lots drawn from the rest of the scoped pool under the
usual high-ability skew. That preserves the Squad Completion Guarantee by construction: a
uniform random draw of `15N` would leave thin positions short about half the time (4.8
LBs and 5.1 RBs on average against 5 needed at a 5-drafter table).

Constants live in `scripts/training/config.py` as `AUCTION_LOTS_PER_DRAFTER` and
`AUCTION_LOTS_PER_POSITION_PER_DRAFTER`. Full rule text is in `PROJECT.md` under
Configuration Mechanics → Formats → Auction.

## Environment Facts

- **Use `C:\Users\Mert\AppData\Local\Programs\Python\Python313\python.exe`.** The
  `python` on the Git Bash PATH is a different interpreter with **no torch installed**.
- Python 3.13.11, torch `2.7.0.dev20250310+cu124`.
- **CUDA is available**: NVIDIA GeForce GTX 1650 Ti (4GB, Turing). Plan for a small GPU —
  large batches will not fit, and CPU-side vectorization may beat GPU for tiny MLPs.
- Windows 10. PowerShell and Git Bash both available; they have different Python
  resolution, as above.

## Landmines

1. **`src/data/botModels/auction_policy.json` is not a trained model.** It is a randomly
   initialized network. `export_weights.py` silently exports an untrained net when no
   checkpoint exists, and there is no `checkpoints/auction/`. Do not ship it, and do not
   read it as evidence that anything worked.
2. **`metrics/auction_metrics.json` and `auction_status.json` are stale** — leftovers
   from the wiped run (champion generation 17, 5,634 drafts). Not a baseline.
3. **`live_config.json` still carries auction overrides** from the failed run — `lr`
   3e-5 (10× lower than the other formats), `c_entropy` 0.06 (the highest), `reward_scale`
   0.01. These are symptoms of fighting an unstable run, not tuned starting points.
4. **`AuctionPolicyNetwork` hardcodes `obs_dim=37`**, and `export_weights.py` repeats
   that 37 in its format table. **Resolved in the spec:** the observation is re-derived
   as 69 features with a pinned feature ordering (spec §5). Both hardcoded 37s must be
   changed to 69. The ordering is a contract with the TypeScript inference path — a
   silent mismatch there is the most likely way this ships broken.
5. **`player_pool.get_scope_mask` does not enforce per-league drafter caps.** Single-league
   scope is 20% of training sampling, but Ligue 1 is unusable at any table size,
   Bundesliga caps at 2 drafters and First Division at 3 (see PROJECT.md → Player Data).
   **Resolved in the spec:** league and table size are sampled *jointly* against the
   viability table in the env's reset (spec §3.2). `get_scope_mask` itself is left
   alone — do not patch it.
6. **The three "finished" formats never reached the specified volume** — roughly 116k
   (Free Pick), 126k (Spin the Wheel) and 166k (Deal or No Deal) drafts against the
   500k+/format rule in PROJECT.md. **Resolved:** Auction is held to convergence, not to
   parity with them — hard floor at the spec'd 500k drafts, 12-hour wall-clock ceiling,
   ship the best checkpoint by benchmark margin. Mert accepts that Auction may end up
   the strongest of the four bots. At the designed throughput the 500k floor costs well
   under two minutes, so it is not a real constraint.
7. **Untracked junk in the repo root** from the old run: `debug.log`, `error.log`,
   `training_log.txt`, `sim_output.txt`, `read_metrics.py` (UTF-16, broken).

## The Design Session (2026-08-19, after the forensics above)

The pipeline was brainstormed to an approved design. Nothing was implemented. The full
document is `docs/superpowers/specs/2026-08-19-auction-training-pipeline-design.md`;
this is the summary.

### A third failure mode, not in the forensics above

The forensics blame throughput and credit assignment. There is very likely a third, and
it may be why the runs *looked* flat rather than merely being flat:

> Reward is `own score − lobby average`. Under self-play with one shared policy,
> `Σᵢ (Sᵢ − mean(S)) = 0` **identically**, every episode, forever. Mean training reward
> is a constant. It cannot move no matter how strong the bot becomes.

If the previous runs were judged on mean episode reward, "it won't improve" was a reading
of a number that is pinned at zero by construction. PPO itself is fine with this — the
signal lives in the within-draft variance and advantages are naturally centred — but a
non-learning frozen opponent is required to measure anything at all. Hence the scripted
bidder below.

### The seven decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Bid loop | **Simultaneous rounds** | All non-high-bidder seats decide at once; highest raise wins, random tie-break; lot ends on a full round with no raise. Keeps the settled Pass/+5/+10/+25 actions, invents no turn order (the game has none — R2-Q5), and batches all five seats into one forward pass: ~375 ticks per draft instead of ~1,875. |
| 2 | Reward delivery | **Potential-based shaping**, γ=1 | Per-step reward is the change in projected room-relative margin. Rewards telescope to *exactly* the settled terminal formula, so the objective is provably unchanged (Ng–Harada–Russell) while feedback arrives on every lot. Also makes blocking (R5-Q6) emerge from the reward instead of needing a bonus term. |
| 3 | Measurement | **Scripted bidder**, frozen | Absolute yardstick that self-play margin cannot provide. Also seeds 12.5% of training seats so early learning faces competent play, and is a shipping fallback. |
| 4 | Queue knowledge | **Past-facing counts** | Bot sees lots revealed and sold per position, never the remaining queue. An MLP has no memory, so this restores the counting an attentive human does — no more, no less. |
| 5 | Stopping | **Train to convergence** | Floor 500k drafts, 12-hour ceiling, ship best-by-benchmark. See landmine 6 above. |
| 6 | Ability skew | **softmax T=10** | Closes Open Questions #3, #16, #29. ~12 of the pool's top 20 reach a 75-lot block, and which twelve varies per draft. |
| 7 | Budget multiplier | **×19** | Amends R8-Q0's ×20. |

### Rule amendments this creates

These are **game rules**, not training knobs, and must be written into `PROJECT.md`:

1. **Budget ×20 → ×19** (amends R8-Q0). Because of the round-to-nearest-100M step this
   moves only Top 5 Leagues, 900M → 800M. Mert chose 19 after seeing that ×20 is
   correctly binding at All Players and Top 5 (budget ÷ best-XI-on-the-block = 0.97) but
   slack at Serie A (1.42) and Bundesliga (1.57). Nothing simple fixes the thin-league
   slack — it comes from top-end pool depth, not average price. **The frontend budget
   figure needs the same change, tracked as a follow-up outside the training work.**
2. **Ability skew = `p ∝ exp((ability − max) / 10)`**, closing Open Questions #3, #16
   and #29. Knock-on: R6-Q2 makes Deal or No Deal's boxes follow the same skew, and that
   bot is already final. Judged a mild distribution shift, not a breakage — flagged, not
   re-trained.
3. **The first bid on a lot is *at* the opening price**, clarifying R8-Q4 against R9-Q3.
   The three increment actions are therefore redundant in round one and mask down to
   `{Pass, Bid}`.

### Assumptions resolved without asking

Recorded in spec §13 so they are cheap to overturn: the first-bid clarification above;
backfill contention between two seats wanting the same cheapest player resolves in random
seat order (the rules do not specify); and the Deal or No Deal skew knock-on.

## Next Steps

1. **Read the spec.** `docs/superpowers/specs/2026-08-19-auction-training-pipeline-design.md`.
   It is approved and is the authority. Do not re-brainstorm it, and do not re-run the
   forensics in this file — both cost context and are already settled.
2. **Write an implementation plan from it**, then execute.
3. **Build order that de-risks fastest:** the slow single-env reference implementation
   first, then the batched env, then parity-test one against the other. A vectorized env
   fails silently; the reference is the only thing that catches it. The invariant
   `Σ shaped rewards == terminal margin` is the second-best guard, since it proves the
   shaping did not alter the objective.
4. **Benchmark throughput before training anything.** Target ≥2,000 drafts/sec against
   the old 4.4–7.0. If it is not there, the batching is wrong and no amount of training
   will help.
5. **Amend `PROJECT.md`** with the three rule changes above.
6. **Clear the junk** listed in landmines 2, 3 and 7.

The two success conditions that matter: throughput ≥2,000 drafts/sec, and the mean margin
against the frozen scripted bidder climbing and then plateauing. A flat benchmark curve
from the start means the design failed — and the diagnostics in spec §8 (clearing price
÷ opening bid, unspent budget, backfilled slots, action distribution) are there to say
which half.
