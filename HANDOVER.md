# Handover — 2026-08-18 (draft viability: simulated config gating, merged to main)

Short note for whoever picks this up in a fresh session. `PROJECT.md` is the source of
truth for the game rules, the frontend and the design laws; this file only covers *where
things stand right now* and what to do next.

## What changed this session

Two things, in order: the position reform landed in the data, and then the consequences
of it got measured and wired into the lobbies.

### 1. Draft viability — the lobbies now only offer what the table can seat

Making positions a hard gate meant a Scope needs real supply at all ten slots, so which
configurations are actually *playable* became a question worth answering by measurement
rather than argument. `scripts/simulate_draft_configs.mjs` simulates every configuration
(2,176 of them) against the real pool and writes `draft_config_simulation_results.csv`;
`scripts/generate_viability_data.mjs` compresses that into `src/data/draftViability.ts`
(34 entries — one number per config: the largest table it completes at, since viability
turned out strictly monotonic in lobby size). `src/lib/draftViability.ts` is the lookup
both lobbies use.

Findings that mattered:

- **Only 114 of 2,176 configurations survive.**
- **The nationality Scope was withdrawn entirely** — no nationality seats three
  drafters, only Spain seats two. Cut rather than shipped permanently dimmed. The
  per-nationality *constraints* are untouched.
- **Constraint deadlocks are real** (Open Question #21). Configs that pass 500/500
  unconstrained fail with a constraint, dozens of runs in. This had been waved off as
  unlikely twice without anyone measuring it. **There is still no in-draft fallback
  rule** — the lobby just doesn't offer the configs where it was seen, which is
  containment, not a fix.
- All four formats survive at every lobby size, so no format is ever unavailable.

Both settings panels gate on it live: unavailable options render dashed and faint and
are disabled, the status line names the single setting that doesn't fit, and `Kick off`
disables while a selection doesn't stand. Nothing about pools, depth or simulations
reaches the screen — the only vocabulary is how many seats an option supports.

**If `player_data.csv` ever changes, this whole chain is stale.** Re-run the simulation,
then `node scripts/generate_viability_data.mjs`.

### 2. Position Reform (PROJECT.md, Round 7) Every player's multi-position tag in
`player_data.csv` (e.g. "AMF, RW, LW") was replaced with exactly one canonical position,
decided across three questionnaire rounds and applied in a single 546-player delivery —
not the batched rollout originally expected. Key rule changes, all folded into
PROJECT.md:

- **Positions are now a hard gate.** A footballer only ever fills the one slot they're
  listed for — in any format, at draft time or after. Not a default, no override.
- **Auction purchases go straight into an open slot by default.** A purchase only lands
  in the graveyard if every slot for that position is already full — overflow, not the
  universal landing zone an earlier pass at this rule described — and it's a straight
  two-way swap: whoever gets bumped out goes into the graveyard in turn. The
  end-of-auction backfill always places directly, since it only ever targets empty
  slots and can't overflow.
- **Free Pick / Spin the Wheel filter out a footballer whose slot is already full** from
  what's selectable that turn — the same mechanism as the existing Constraint filter,
  since neither format has a graveyard to catch an overflow pick the way Auction does.
- **Multi-Position Eligibility and Post-Draft Editing were narrowed or retired** —
  there's nothing left to reassign once a player has exactly one position. What
  survives post-draft is graveyard swapping, and that's Auction-only: Free Pick, Spin
  the Wheel and Deal or No Deal have no graveyard, and whether any of them get a
  post-draft equivalent is still an open question.
- **The CM depth data hole is resolved.** CM went from 10 to 93 pool-wide, which flipped
  the Scope max-drafter ceiling table — 4 of 5 single-league Scopes can now seat a
  draft (only Ligue 1 Uber Eats stays unusable, now CB-limited instead of CM-limited).

Two files ride along with the reform:
`player_single_position.csv` (the source delivery, `Name,Nation,Position`) and
`player_data_multiposition_backup.csv` (the pre-reform CSV, kept as a record).
`player_names_clubs.csv` and `player_names_nations.csv` are unrelated ad-hoc convenience
exports Mert asked for mid-session — not load-bearing, not referenced by anything.

## State

- **Branch:** `draft-viability` was committed, pushed and merged into `main` on
  2026-08-18, on top of `position-reform` earlier the same day.
- `npm run build` and `npm test` both pass — **17 tests, 5 files** (two new, covering
  the seat-dependent gating).
- **Not re-verified in a browser at every viewport.** Mert checked the lobbies by hand
  this session (that's how the crest clipping was caught), but the full
  1280×800 / 1280×700 / 768×568 / 320×568 sweep hasn't been redone since the gating
  landed. The panels gained no height — unavailable options are restyled, not added —
  so nothing is expected to have moved, but it's unconfirmed.
- Routes, standing laws and shell architecture are unchanged from the `seamlessness`
  merge — see below.

## What's on screen

- **Persistent Shell & Backdrop:** `src/components/layout/AppShell.tsx` and
  `src/components/layout/AmbientBackdrop.tsx`. The stadium plate and its 30s ambient
  zoom/drift animation stay continuously mounted across all routes, smoothly transitioning
  masks between full-bleed (Home) and corner-anchored (Lobbies).
- **Shared Split Studio Diptych:** `src/components/lobby/LobbyLayout.tsx`. Both `SoloLobby`
  and `MultiLobby` now render through this shared organism, guaranteeing identical
  spatial rhythm, surface steps, and height-query collapses.
- **UI Primitives:** `src/components/ui/Button.tsx`, `src/components/ui/StatusLine.tsx`,
  and `src/components/ui/SectionLabel.tsx`.
- **Routes:** `/` (Home), `/solo` & `/solo/:formatId` (Solo Lobby), `/lobby/:code` (Multi Lobby).

## Decisions worth not re-litigating

- **Backdrop persistence in `AppShell`:** Image element and drift animation loop live at
  the root layout level so page transitions never restart the 30-second keyframe timer or
  flash an unmounted image.
- **Shared `LobbyLayout`:** Solo and Multi lobbies share a single 50/50 diptych structure
  rather than duplicate layout trees, keeping spacing tokens and responsive breakpoints
  perfectly aligned.
- **The gate is rendered from two places, not one.** Over the home page for create/join,
  and over the lobby itself when the room has no session — which is what makes a pasted
  `/#/lobby/KX7QD` behave identically to clicking Create.
- **A real `<dialog>` with `showModal()`**, not a hand-rolled overlay — inertness, focus
  trapping and Escape come free.
- **Host-ness lives in router state *and* `sessionStorage`**, keyed by code.
- **Guest settings are derived from a hash of the code**, not random.
- **`minSeats` is 1 in the friends lobby, 2 in the solo one.**
- **`SeatList` is generalised** for typed `Seat`s (`you` / `human` / `bot`).
- **Chat is the one scrolling region in the app.**
- **Player positions are a hard gate** — a footballer only ever fills the one slot in
  `player_data.csv`'s Position column, no reassignment, no exceptions. Relevant the
  moment the draft screen starts reading that column.
- **Availability is measured, not asserted.** What the lobbies offer comes from a
  simulation of the real pool, not from hand-reasoning about supply. If a configuration
  looks wrongly unavailable, fix the simulation or the data and regenerate — don't
  hand-edit `src/data/draftViability.ts`, it's generated.
- **Unavailable options are shown, not removed.** Dashed, faint and disabled, so the
  row keeps its shape and you can see what a smaller table would unlock. The one thing
  removed outright was the nationality Scope, because it failed at every size.
- **No auto-correction.** A selection that becomes unplayable stays selected and goes
  dashed rather than silently snapping to a valid value.

## Gotchas worth not rediscovering

- **The height query is still the trap.** Vertical rhythm is `@media (max-height: 720px)`
  in `index.css`, never `clamp()` against `vh`.
- **320×568 has about 2px of slack** in the tallest state. Measure before adding elements.
- **`@media (max-height: 720px)` must come *after* the `min-width: 768px` rule** for
  `.lobby-chat`.
- **Asset paths in `src/` go through `import.meta.env.BASE_URL`**, never a leading slash.
- **The page never scrolls.** `100dvh`, `overflow: hidden`. All routes hold it.
- **`@theme static`**, not plain `@theme`.
- **`player_data.csv`'s Position column is now a single unquoted value**, not a quoted
  comma list — any future parser should expect e.g. `ST`, not `"RW, LW, ST"`.
- **Crest images need `min-h-0 min-w-0`.** A grid item's automatic minimum size
  (`min-height: auto`) is content-based and, for a replaced element, clamps the height
  back *up* past an explicit `h-[64%]` via the intrinsic aspect ratio. Only bites
  portrait marks — Serie A and Ligue 1 clipped along the chip's bottom edge; the
  landscape/square ones were fine. `mockups/crest-chip.html` reproduces it before/after
  at 6×.
- **`src/data/draftViability.ts` is generated** — regenerate, never hand-edit. Its
  inputs are `draft_config_simulation_results.csv` and, upstream of that,
  `player_data.csv`.
- **The simulation models some mechanics that aren't specced** (Auction bidding
  strategy, the D-o-N-D proposer, the wheel). Those stand-ins are documented in the
  script header and are **not** rules — don't mine them for game design.

## Standing laws (project-wide, don't reopen)

1. **No I-beam** except in boxes you type into. `pointer` across an interactive's *entire*
   span, label text included.
2. **Motion everywhere, small** — and in the quiet register: fades with a little travel.
3. **Only Oswald and Inter** — logos excepted (Bebas Neue is the wordmark, nowhere else).
4. **Petrol is the palette.** Four primes, everything else via `color-mix`.
5. **Never recolour a crest.** Full colour, unfiltered; the surface around it stays
   quiet. Dimming a whole *control* that happens to contain a crest is fine and is what
   the unavailable league chips do — nothing greyed, filtered or silhouetted, and the
   badge keeps every colour it has.
6. **No internal data on screen.** Pool counts, per-position depth, the absence of a
   scoring system — none of it is the user's business, regardless of how healthy the
   underlying data is.
7. **No format is the default.** All four are equals; a screen with none chosen selects
   none.
8. **Copy is professional, matter-of-fact, descriptive.**
9. **Fake the functionality** — see HANDOVER history; still governs the lobby screens.

## Next

1. **The draft screen** (frontend). Still the only thing in the app that says it doesn't
   exist, and both lobbies hand it a complete configuration — format, scope, the
   narrowed league, constraint, timer, and the full table of seats with who's a human,
   who's a bot and who's the host, all of it now guaranteed to be a configuration that
   can actually be played. This is the first code that will really read
   `player_data.csv`'s Position column, so the hard-gate rule becomes load-bearing the
   moment it's built.

2. **Open Question #21 needs an actual rule** (game design). The Free Pick constraint
   deadlock is now demonstrated rather than hypothetical, and the lobby only *contains*
   it by refusing the configurations where it was observed. A draft that deadlocks
   anyway has no defined behaviour. Candidates: auto-waive the constraint for one pick,
   pause for the host, or something else. This wants a questionnaire round.

3. **Post-draft editing for the graveyard-less formats** (game design, R7.3-Q5 leftover).
   Free Pick, Spin the Wheel and Deal or No Deal have no graveyard, so whether they get
   any post-draft equivalent is undecided.

Further out: real Firebase wiring behind the simulation — `lobbyPeople.ts` and the
arrival timers in `MultiLobby.tsx` are the seam. Bot decision logic stays deferred (and
note the viability simulation's Auction model is a neutral placeholder *because* of
that, so real bidding logic may change which Auction configurations are viable). There's
still no scoring system anywhere by design.
