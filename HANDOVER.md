# Handover — build the Free Pick draft screen

**Written:** 2026-08-19, on the `free-pick-ui-static` branch.
**For:** the next session, which builds this screen. Nothing has been implemented yet.

---

## The decision

An exhibition of **20 static layouts** for the Free Pick draft screen was built at
**`mockups/free-pick.html`** (one per Hallmark macrostructure; Feature Stack excluded because it
needs scroll and this app never scrolls).

**Mert picked layout 18 · "Sections" — the Specimen macrostructure.** That is what gets built.
The other nineteen stay in the file, same as the home and lobby exhibitions did.

Open the file straight off disk (`file://`) — no build step, no server. Click a frame to zoom it to
full 1280×800, click again to shrink. **Read frame 18 before writing any code**; this document
describes it but the frame is the specification.

---

## What layout 18 is

A **five-section, hairline-ruled, three-column** reading of the draft. Every region is explicitly
numbered and named, nothing competes for attention, and a new drafter could be told where to look in
one sentence. It is the most orderly of the twenty, and it was picked over the denser candidates on
that basis.

The frame is `1280 × 800`, `padding: 34px 56px`, one `100dvh` viewport with no scroll.

**Masthead** — wordmark left (`#` in accent + `footydraft` in Bebas), the configuration as a single
quiet line right: `Free Pick · Top 5 leagues · 1 per club`. A `--color-line-strong` rule under it.

**Then a three-column grid, `296px / 1fr / 268px`,** divided by 1px hairlines rather than surface
steps. Each column holds numbered sections:

| § | Section | Column | Holds |
|---|---|---|---|
| 01 | The clock | left | `09` at 64px in Oswald tabular, a depleting `.tbar` rule, and `Round 5 of 11 · pick 18 of 44` underneath |
| 02 | The table | left | the four seats, yours in accent, each captioned `done` / `now` / `next` / `then`, plus "The order reverses at the end of every round." |
| 03 | Spent | left | the club crests you have used, dimmed to 34%, under the constraint's one-line explanation |
| 04 | Who is left | centre | search field, then the pool as ruled player rows — crest, name, club·nation·age, position code — with the selected row on `--color-accent-soft`; a rule, then the reason line and the `Draft →` button |
| 05 | Your eleven | right | the 4-2-3-1 as eleven stacked slots, filled ones solid, open ones dashed, the pending one in accent; chat sits underneath, anchored to the bottom |

**The section label rule that matters:** each numeral (`01`, `02`, …) is stacked **directly above**
its own heading in the same column. Do **not** hang the number in a left margin beside the heading —
that hanging-header pattern is a templated-editorial tell and Hallmark auto-fails it (gate 54). The
frame already does this correctly; keep it.

---

## The draft state the frame is drawn in

All twenty frames share one internally consistent position, and every value in it is real. Keep it
when porting, because it exercises the rules that matter:

- **Format** Free Pick · snake · 11 rounds
- **Scope** Top 5 leagues
- **Constraint** 1 per club — *your own squad only*
- **Table** 4 drafters (you = seat 2; Priya, Bot 1, Bot 2)
- **Moment** round 5 of 11 · pick 18 of 44 · your turn · 9s left
- **Your four** Haaland ST (Man City) · van Dijk CB (Liverpool) · Bellingham AMF (Real Madrid) ·
  Kimmich CDM (Bayern Munich)
- **Open** GK · CB · LB · RB · CM · LW · RW
- **The teaching moment** those four picks spend City, Liverpool, Madrid and Bayern, which knocks
  Valverde, Camavinga, Foden, Rüdiger, Militão, Araujo, Rodrygo, Alexander-Arnold, Donnarumma and
  Bernardo Silva off *your* board while leaving them on everyone else's. Seeing the best players
  left crossed out is what makes the per-squad constraint legible without a sentence of prose.

Every player, club, nation, age, crest and photo path in the file was verified against
`player_data.csv`. The configuration was verified viable against `src/data/draftViability.ts`
(`free-pick|top-5|club-1` seats 5). If you change the state, re-verify both.

---

## Two decisions baked into the frames — inherit them

**1. No ability ratings and no pool counts anywhere.** Ability is a data-model fact and `PROJECT.md`
keeps those off screen (no pool counts, no per-position depth). Free Pick has no currency either.
So **the only numerals on this screen are the clock, the round number and the pick number.** That
turned out to be a feature rather than a limitation: Auction is the numbers format, Free Pick is the
names format, and the screen is quiet because of it. A "best available" ordering is fine — a
*number* next to a player is not.

**2. An unavailable row is dimmed whole, crest included.** Never grayscale, filter, recolour or
silhouette a crest on its own — a recoloured badge is a falsified badge. The lobby already
established whole-control opacity as the sanctioned treatment for unavailability; the player rows
use `.pr.no { opacity: .3 }` plus a strikethrough on the name only.

---

## Rules the screen has to honour

From `PROJECT.md` → Configuration Mechanics → Formats → Free Pick, and Position Reform:

- **Snake draft, 11 picks, one slot each.** Order reverses every round. First pick order is a random
  draw at draft start.
- **Positions are a hard gate.** A footballer only ever fills the one slot they are listed for. There
  is no graveyard in Free Pick, so a player whose slot is already full in your XI is **filtered out
  of what you can select** — not offered and then rejected.
- **Constraints are Free Pick only**, exactly one active, and checked **per your own squad**. Illegal
  players are filtered out of selection the same way.
- **Turn timer** defaults to ~15s and the host can turn it off entirely — so the layout must survive
  having no clock at all. §01 is the section that has to degrade gracefully.
- **On timeout** the system auto-picks the cheapest eligible remaining footballer for that slot.
- **Chat stays fully active at all times.**
- **Bots** pace at 1.5–3.5s per move. Bots get abstract rings, never player faces.
- **A draft can never end with an unfilled slot.**

---

## What is *not* decided, and is yours to settle

- **Motion.** The exhibition is deliberately motionless — first-look only, by instruction. The whole
  motion layer still has to be designed, and it must land in the quiet register: smooth simple fades
  with a little travel, compositor-only (`transform` / `opacity` / `clip-path`), nothing overshooting
  or bouncing, everything collapsing under `prefers-reduced-motion`. The ambient stadium plate keeps
  drifting on the shared 30s `AppShell` loop — do not restart it.
- **Responsive behaviour.** The frame is drawn at 1280×800 only. The lobbies are verified at
  1280×800, 1280×700, 768×568 and 320×568, and this screen has to reach the same bar with no scroll
  and no horizontal overflow. Expect the three columns to have to collapse; note the lobby's lesson
  that `clamp()` against `vh` never reaches its minimum at 568px tall, so spacing tokens want a
  `@media (max-height: 720px)` height query instead.
- **Where the route lives.** There is no draft screen yet — both lobbies' `Kick off` currently
  admits it goes nowhere. That honest dead end can be replaced once this screen exists.
- **Real data.** Nothing is wired to Firebase. Per the standing **fake-the-functionality** rule, the
  screen should simulate the draft rather than announce the gap: bots pick on a stagger, the clock
  runs, chat sends, picks land in the XI.

---

## Where the rules live

- `PROJECT.md` — the living source of truth for every game rule. Free Pick, Position Reform, Draft
  Viability, and the Frontend section's design law all matter here.
- `frontend_inspo.md` — design direction and the patterns behind it.
- `.hallmark/log.json` — the exhibition run is logged as the newest entry.

**Design law that is settled and project-wide:** petrol palette, four primes, everything else derived
through one `color-mix(in oklab, …)` block; Oswald + Inter only, Bebas Neue for the wordmark alone;
the page never scrolls; no I-beam over anything non-editable; no glow; off-white never `#fff`;
crests full colour and never recoloured; copy professional and matter-of-fact with no voicey
microcopy; no format is the default.

---

## Verify with

```
npm run build      # typecheck + build
npm test           # Vitest smoke test
npm run dev        # the real thing
```

Plus a browser pass at 1280×800, 1280×700, 768×568 and 320×568 — no scroll anywhere, no horizontal
overflow, the action always above the fold.

---

## One loose end, not mine to fix

`PROJECT.md` currently carries the auction-training handover **twice** — `## Project Handover` and
`## Project Handover (merged)` are near-identical copies, and the `## Git Operations` block is
duplicated at the end. That came from folding the previous `HANDOVER.md` into `PROJECT.md` in an
earlier session. It is unrelated to this work and was left alone rather than silently rewritten;
worth deduping next time someone is in that file.
