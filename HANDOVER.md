# Handover — 2026-08-18 (position reform: single-position data model, merged to main)

Short note for whoever picks this up in a fresh session. `PROJECT.md` is the source of
truth for the game rules, the frontend and the design laws; this file only covers *where
things stand right now* and what to do next.

## What changed this session

**Position Reform (PROJECT.md, Round 7).** Every player's multi-position tag in
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

**No frontend code changed.** `src/` doesn't read `player_data.csv` yet — that's the
draft screen, which isn't built. Two files ride along with the reform:
`player_single_position.csv` (the source delivery, `Name,Nation,Position`) and
`player_data_multiposition_backup.csv` (the pre-reform CSV, kept as a record).
`player_names_clubs.csv` and `player_names_nations.csv` are unrelated ad-hoc convenience
exports Mert asked for mid-session — not load-bearing, not referenced by anything.

## State

- **Branch:** `position-reform` was committed, pushed and merged into `main` on
  2026-08-18.
- `npm run build` and `npm test` both pass (15 tests, 5 files) — unaffected, since this
  branch touched data and docs only, no `src/`.
- Frontend state (routes, verified viewports, standing laws) is unchanged from the
  `seamlessness` merge — see below.

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
- **Player positions are a hard gate** (new this session) — a footballer only ever fills
  the one slot in `player_data.csv`'s Position column, no reassignment, no exceptions.
  Relevant the moment the draft screen starts reading that column.

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

## Standing laws (project-wide, don't reopen)

1. **No I-beam** except in boxes you type into. `pointer` across an interactive's *entire*
   span, label text included.
2. **Motion everywhere, small** — and in the quiet register: fades with a little travel.
3. **Only Oswald and Inter** — logos excepted (Bebas Neue is the wordmark, nowhere else).
4. **Petrol is the palette.** Four primes, everything else via `color-mix`.
5. **Never recolour a crest.** Full colour, unfiltered; the surface around it stays quiet.
6. **No internal data on screen.** Pool counts, per-position depth, the absence of a
   scoring system — none of it is the user's business, regardless of how healthy the
   underlying data is.
7. **No format is the default.** All four are equals; a screen with none chosen selects
   none.
8. **Copy is professional, matter-of-fact, descriptive.**
9. **Fake the functionality** — see HANDOVER history; still governs the lobby screens.

## Next

Two independent threads:

1. **The draft screen** (frontend). Still the only thing in the app that says it doesn't
   exist, and both lobbies hand it a complete configuration — format, scope, the
   narrowed league/nation, constraint, timer, and the full table of seats with who's a
   human, who's a bot and who's the host. This is also the first code that will actually
   read `player_data.csv`'s Position column, so the hard-gate rule above becomes load-bearing
   the moment it's built.
2. **Position Reform, Round 4** (data/rules, whenever Mert wants it). Open: whether Free
   Pick, Spin the Wheel, or Deal or No Deal — none of which have a graveyard — get any
   post-draft-editing equivalent. Open Question #21 (Free Pick constraint deadlock) stays
   flagged as unlikely-but-undefined; revisit if it turns out to matter.

After the draft screen: real Firebase wiring behind the simulation — `lobbyPeople.ts` and
the arrival timers in `MultiLobby.tsx` are the seam. Bot decision logic stays deferred,
and there's still no scoring system anywhere by design.
