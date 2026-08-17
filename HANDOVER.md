# Handover — 2026-08-17 (single-player lobby, built)

Short note for whoever picks this up in a fresh session. `PROJECT.md` is the source of
truth for the game rules, the frontend and the design laws; this file only covers *where
things stand right now* and what to do next.

## State

- **Branch:** `singleplayer-lobby`, cut from `main`. Nothing merged back yet.
- **The lobby is built.** Layout 04 "Ready room" was picked off `mockups/lobby-solo.html`
  and ported into `src/`. `npm run build` and `npm test` both pass (7 tests, 2 files).
- **The router is back.** `App.tsx` is a `HashRouter` over `/`, `/solo`,
  `/solo/:formatId` and a catch-all home. The home page's format tiles now navigate;
  Create / Join are still honest dead ends.
- **Untracked and uncommitted, not mine:** `public/clubs/` (69 SVGs), `public/leagues/`
  (5 SVGs) and `scripts/process_club_logos.py`, which Mert landed in the previous
  session. The lobby uses the league marks. Nothing in this repo gets added or committed
  unless he asks.
- **Verified in a browser** at 1280×800, 1280×700, 768×568 and 320×568, in the tallest
  possible state (Free Pick + One league). No scroll anywhere, footer always above the
  fold.

## What's on screen

`src/routes/SoloLobby.tsx` and four components in `src/components/lobby/`:
`SeatList`, `ChipGroup` (which also exports `chipClass` and `Collapse`), `ScopeDetail`,
`LobbyPlate`. Options live in `src/data/lobbyOptions.ts`.

A hard 50/50 diptych — the table left on `--color-surface`, the settings right on the
ground, divided by that surface step rather than a rule. Five seat rows (you as an accent
disc, bots as numbered outline rings, a dashed "add a bot" row while there's room), and
four chip groups on the right over a stadium plate cornered bottom-right.

## Four rules Mert set on this build

Folded into `PROJECT.md` (→ *Copy*, → *Interaction rules*) but worth repeating:

1. **No internal data on screen.** Pool counts, per-position depth, the CM gap, the
   absence of a scoring system — none of it is the user's business. It's implementation
   state, and showing it makes a to-do look permanent.
2. **The CM gap is not a problem to design around.** It will be fixed in the CSV. The
   earlier plan to render "Bundesliga · 0 CM" disabled reasons is dead.
3. **No format is the default.** All four are equals. A bare `/solo` selects *none* and
   disables `Kick off` rather than picking one.
4. **Copy is professional, matter-of-fact, descriptive.** And motion is smooth, fade-y
   and simple — `fd-soft` is the register, not the home page's wipe.

## Decisions worth not re-litigating

- **The Constraint group collapses rather than dimming.** Reserving its space and fading
  it leaves a group-sized hole that reads as breakage. Each group carries its own top
  spacing *inside* the collapsing wrapper so the gap collapses with it. Same for the
  scope sub-row.
- **Crests get a 1px ink stroke** (`.crest` in `index.css`) — four chained
  `drop-shadow`es drawn *around* the artwork, so nothing inside is recoloured. Two of the
  five league marks are dark and vanish otherwise; the alternative, a light plate behind
  each, is five bright tiles on a screen with no other bright surface. Mert asked for the
  stroke directly.
- **"Turn timer", not "Bid timer"** — it applies to every format.
- **Vertical rhythm is `@media (max-height: 720px)`, not `clamp()`.** A clamp against
  `vh` never reaches its minimum at 568px tall (the middle term is still in range), so
  lowering the min does nothing. The lobby's spacing tokens live in one `.lobby` block in
  `index.css` and collapse under that query. **This is the trap to remember** — an hour
  went into rediscovering it.
- **The route is keyed on the format id.** Without the key React reuses the component
  instance and the seeded `useState` never re-runs, so `/#/solo/a` → `/#/solo/b` silently
  keeps the old format.
- **Two seat renderings.** Ruled rows at `md`+; a strip of discs with `+`/`−` below,
  because the rows and their captions don't fit a short viewport that also has to hold
  four settings groups.

## Standing laws (project-wide, don't reopen)

1. **No I-beam** except in boxes you type into. `pointer` across an interactive's *entire*
   span, label text included.
2. **Motion everywhere, small** — and in the quiet register: fades with a little travel.
3. **Only Oswald and Inter** — logos excepted (Bebas Neue is the wordmark, nowhere else).
4. **Petrol is the palette.** Four primes, everything else via `color-mix`.
5. **Never recolour a crest.** Full colour, unfiltered; the surface around it stays quiet.

## Gotchas worth not rediscovering

- **Bots get abstract marks, never player faces.** A face implies the bot *is* somebody.
- **Bots have no personality picker.** One consistent default style, by design.
- **Nothing auto-fills the lobby.** Bots are added by hand, 2–5 total including you. The
  empty seat staying visible is the point.
- **Playwright MCP refuses `file:` URLs.** To smoke-test a mockup, serve the repo root:
  `python -m http.server 8900 --bind 127.0.0.1`. A browser opens the file fine off disk.
- **Asset paths in `src/` go through `import.meta.env.BASE_URL`**, never a leading slash.
- **Player photo slugs are full names** — `public/players/erling-haaland.webp`.
- **The page never scrolls.** `100dvh`, `overflow: hidden`. Both routes hold it.
- **`@theme static`**, not plain `@theme` — Tailwind prunes theme variables no utility
  references, and most derived tokens are read by hand-written CSS.

## Next

The draft screen is the obvious gap — `Kick off` is currently the only dead end left in
single player, and the lobby hands it a complete configuration (format, scope, the
narrowed league/nation, constraint, timer, seat count).

After that, the friends lobby behind Create / Join — same router, plus the first real
Firebase wiring. Bot decision logic stays deferred, and there's still no scoring system
anywhere by design.
