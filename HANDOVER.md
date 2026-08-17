# Handover — 2026-08-18 (seamlessness & shared shell, merged to main)

Short note for whoever picks this up in a fresh session. `PROJECT.md` is the source of
truth for the game rules, the frontend and the design laws; this file only covers *where
things stand right now* and what to do next.

## The rule that changed this session

**Fake the functionality.** Project-wide, set by Mert mid-build, replacing the old "dead
ends stay honest" rule. Where a screen needs a backend that doesn't exist, **the screen
simulates it** rather than announcing the gap. In this lobby that means people arrive on
a stagger and take real seats, chat sends, and a room code you were handed already has a
host and settings behind it. The reasoning: the screen should reach its real states now,
so the Firebase wiring drops in behind a UI that already behaves — and so the thing can
be judged as a product rather than as a scaffold.

Disabled controls still carry a visible reason (a disabled control is a real state, not a
confession). The one thing not faked is a **destination that doesn't exist**: `Kick off`
can't navigate to a draft screen nobody has built, so it says so. That is the only
remaining dead end in the app.

The home page's status line went with the rule — every control down there now goes
somewhere, so there was nothing left for it to report.

## State

- **Branch:** `seamlessness` was committed, pushed and merged into `main` on 2026-08-18.
- `npm run build` and `npm test` both pass (15 tests, 5 files) as of the merge into `main`.
- **Verified in a browser** at 1280×800, 1280×700, 768×568 and 320×568, across all routes
  (Home, Solo Lobby, Multi Lobby host & guest). Zero body scroll, zero layout shifts,
  persistent continuous backdrop animation, footer always above the fold.

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

## Gotchas worth not rediscovering

- **The height query is still the trap.** Vertical rhythm is `@media (max-height: 720px)`
  in `index.css`, never `clamp()` against `vh`.
- **320×568 has about 2px of slack** in the tallest state. Measure before adding elements.
- **`@media (max-height: 720px)` must come *after* the `min-width: 768px` rule** for
  `.lobby-chat`.
- **Asset paths in `src/` go through `import.meta.env.BASE_URL`**, never a leading slash.
- **The page never scrolls.** `100dvh`, `overflow: hidden`. All routes hold it.
- **`@theme static`**, not plain `@theme`.

## Standing laws (project-wide, don't reopen)

1. **No I-beam** except in boxes you type into. `pointer` across an interactive's *entire*
   span, label text included.
2. **Motion everywhere, small** — and in the quiet register: fades with a little travel.
3. **Only Oswald and Inter** — logos excepted (Bebas Neue is the wordmark, nowhere else).
4. **Petrol is the palette.** Four primes, everything else via `color-mix`.
5. **Never recolour a crest.** Full colour, unfiltered; the surface around it stays quiet.
6. **No internal data on screen.** Pool counts, per-position depth, the CM gap, the
   absence of a scoring system — none of it is the user's business.
7. **No format is the default.** All four are equals; a screen with none chosen selects
   none.
8. **Copy is professional, matter-of-fact, descriptive.**
9. **Fake the functionality** — see the top of this file.

## Next

**The draft screen.** It is now the only thing in the app that says it doesn't exist, and
both lobbies hand it a complete configuration — format, scope, the narrowed
league/nation, constraint, timer, and the full table of seats with who's a human, who's a
bot and who's the host.

After that, the real Firebase wiring behind the simulation: `lobbyPeople.ts` and the
arrival timers in `MultiLobby.tsx` are the seam — replace them with a subscription and
the rest of the screen shouldn't have to change. Bot decision logic stays deferred, and
there's still no scoring system anywhere by design.
