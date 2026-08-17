# Handover — 2026-08-17 (multiplayer lobby, built)

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

- **Branch:** `multiplayer-lobby`, cut from `main`. Nothing merged back yet.
- **Built, and nothing is committed** — `git status` is the full picture. Standing rule:
  nothing in this repo gets added or committed unless Mert asks.
- `npm run build` and `npm test` both pass (11 tests, 3 files).
- **Verified in a browser** at 1280×800, 1280×700, 768×568 and 320×568, as host and as
  guest, in the tallest possible state (Free Pick + One league, five seats). No scroll,
  no horizontal overflow, footer always above the fold.

## What's on screen

`src/routes/MultiLobby.tsx` at `/lobby/:code`. New components: `NameGate`, `RoomCode`,
`LobbyChat`. New data: `src/data/lobbyPeople.ts`. New modules: `src/lib/roomCode.ts`,
`src/lib/lobbySession.ts`.

The same Split Studio diptych as the solo lobby, re-cut. **Create a lobby** mints a
five-character code and **Join lobby** takes a typed one; both stop at the same name gate
and then open the room. The left half leads with the **room code as display type** plus a
Copy-link control, then the seats, then the chat. The right half is the same four chip
groups — interactive for the host, static chips carrying the host's choices for everyone
else.

## Decisions worth not re-litigating

- **The gate is rendered from two places, not one.** Over the home page for create/join,
  and over the lobby itself when the room has no session — which is what makes a pasted
  `/#/lobby/KX7QD` behave identically to clicking Create. One component, two mount
  points; the alternative (gate owned solely by the lobby route) flashes the lobby behind
  it, and the alternative (gate owned solely by Home) breaks invite links.
- **A real `<dialog>` with `showModal()`**, not a hand-rolled overlay — inertness, focus
  trapping and Escape come free. There's a fallback to the plain `open` attribute because
  jsdom doesn't reliably carry `showModal`, and the scrim is drawn *inside* the dialog
  rather than on `::backdrop` so it survives that fallback.
- **The dialog is labelled with `aria-label`, not the `<h2>`.** Pointing `aria-labelledby`
  at a heading that reads "Your name" gives the dialog the same accessible name as the
  field inside it, and every by-label query then matches two elements.
- **Host-ness lives in router state *and* `sessionStorage`**, keyed by code. Router state
  alone means a refresh silently demotes the host to a guest.
- **Guest settings are derived from a hash of the code**, not random — the same code has
  to open the same lobby twice.
- **`minSeats` is 1 in the friends lobby, 2 in the solo one.** A bot added early has to
  be removable when a human turns up; the 2-drafter minimum is enforced at kick-off
  instead, with the reason in the status line.
- **`SeatList` was generalised rather than duplicated** — it takes a list of typed
  `Seat`s (`you` / `human` / `bot`) and both lobbies build that list. Bots still get an
  outlined ring with a number, people get their initial, you get the one filled disc.
- **Chat is the one scrolling region in the app.** The page never scrolls; a conversation
  has to go somewhere. Its scrollbar is styled — the default is a bright slab on a
  near-black ground.

## Gotchas worth not rediscovering

- **The height query is still the trap.** Vertical rhythm is `@media (max-height: 720px)`
  in `index.css`, never `clamp()` against `vh` — a clamp never reaches its minimum at
  568px tall. The chat's show/hide lives in the same block for that reason.
- **320×568 has about 2px of slack** in the tallest state. That is why the left half
  hides its "Who's playing" header below `md`, why the room code collapses onto one row
  there, and why the seat strip's gap drops to 4px. Any new element on the left half has
  to pay for itself at that size — measure before adding.
- **`@media (max-height: 720px)` must come *after* the `min-width: 768px` rule** for
  `.lobby-chat`; equal specificity, so source order decides.
- **Playwright MCP refuses `file:` URLs.** For the app, `npm run dev`; to smoke-test a
  mockup, serve the repo root with `python -m http.server 8900 --bind 127.0.0.1`.
- **Asset paths in `src/` go through `import.meta.env.BASE_URL`**, never a leading slash.
- **The page never scrolls.** `100dvh`, `overflow: hidden`. All three routes hold it.
- **`@theme static`**, not plain `@theme` — Tailwind prunes theme variables no utility
  references, and most derived tokens are read by hand-written CSS.

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
