# #footydraft — Project Rules

This document is the living source of truth for how the game works. It starts from
`initial_briefing.txt` and gets updated after each questionnaire is answered
(`questionnaire_1.md`, `questionnaire_2.md`, ...) so it always reflects the latest
decisions. Open questions are tracked at the bottom and resolved into the rules above
as answers come in.

**Status:** rounds 1–6 (60 questions) were answered and folded into the rules below;
the raw questionnaire files, the self-play RL bot-training pipeline, and the
single-player HTML prototype have all since been removed in a workspace cleanup
(2026-08-15) — none of that infra is needed for the frontend build. The rules
they informed (player pool calibration, Auction pricing formula) remain in force below.
Player Current Ability calibration and the Derived Price / Auction Opening Bid formula
are already baked into `player_data.csv`'s columns.

The frontend build began on 2026-08-15 (`frontend` branch). On 2026-08-17 the home
page's visual direction was reopened on the **`frontend-retry`** branch, a 20-layout
exhibition was built beside it (`mockups/home.html`), and layout **04 "The wall"** on the
**petrol** palette was picked. The old home page and the old lobby were then **deleted
outright** and the home page rebuilt from that layout — see Frontend below. **The home
page is now the entire site**: there is no lobby, no router and no second route, and every
control on the page is an honest dead end that says so. No Firebase wiring and no bot
decision logic exist yet — both remain deliberately deferred.

## Tachyon Mode

A workflow keyword Mert invokes during build sessions — not a game rule, a process one.
When he says **"Tachyon mode"**:

1. **No brainstorming skill.** Skip straight past it.
2. **No separate, explicit plan phase** — unless he asks for one.
3. **No million tests.** Minimal, sensible coverage, not a suite.
4. **Build unceremoniously.** Pick sensible defaults instead of asking mid-build;
   state the choices in the summary afterward so he can overrule them.
5. Usually invoked with **Opus on xhigh** reasoning effort.

This doesn't relax the standing rule against unrequested git operations (add/commit
only when explicitly asked) — Tachyon mode is about build ceremony, not repo hygiene.

## Overview

"#footydraft" is a website where friends draft football players together in various
game formats, scopes and constraints. Bots can be added to lobbies, or a user can play
single player against them. There is no scoring system — squads are simply compared
and can be shared. Lobbies have a persistent chat box.

The formation is always **4-2-3-1**: GK, CB, CB, LB, RB, CDM, CM, AMF, LW, RW, ST. This
is constant and cannot change.

## Hosting / Stack

- Frontend hosted on **GitHub Pages**. Built with **Vite + React 19 + TypeScript +
  Tailwind v4**. Routing is **`HashRouter`** — GitHub Pages serves static files with no
  rewrite rules, so deep links have to live in the hash. Vite `base` is `'./'` so the
  build works from a project subpath without hardcoding the repo name.
- Backend/data via **Firebase / Firestore** (or whatever Firebase service fits —
  realtime lobby state, auth, etc. TBD as needed). **Nothing is wired yet.**
- **No global store.** State lives next to the thing that needs it; each future data
  need gets its own hook owning one subscription. See `frontend_inspo.md` §2.2.
- AI bot decision logic (how a bot bids, sticks, takes offers, etc.) is **explicitly
  deferred** — not yet speced out (R2-Q8). A prior self-play reinforcement-learning
  attempt at this was scrapped in the 2026-08-15 cleanup; this document only covers
  the game rules bots (and humans) must follow, not how a future bot implementation
  decides its moves.

## Frontend

Design direction and the patterns behind it are recorded in `frontend_inspo.md`. The
home page's own spec is `docs/superpowers/specs/2026-08-15-home-page-design.md`.

### Design tokens

**Petrol is the palette. This is settled and project-wide** — not a per-page choice.

Defined once in `src/styles/index.css` as a Tailwind v4 `@theme static` block. The
palette declares **four primes**; every other colour in the app derives from those four
through one `color-mix(in oklab, …)` block written once, exactly as the exhibition file
does it. Nothing anywhere else in `src/` declares a colour.

| Prime | Value | Role |
|---|---|---|
| `--color-ground` | `#071414` | page ground — near-black, deep teal |
| `--color-ink` | `#e2f0ee` | primary text — off-white, faintly green |
| `--color-accent` | `#ef7a3c` | orange — primary CTA fill, section titles, focus rings |
| `--color-tint` | `#123030` | the `mix-blend-mode: color` wash over every photograph |

Derived, in the same block: `--color-surface` / `--color-surface-2` (panels, tiles),
`--color-line` / `--color-line-strong` (hairlines), `--color-muted` / `--color-dim`
(secondary and tertiary text), `--color-accent-ink` / `--color-accent-soft` /
`--color-accent-line` (text on orange, hover fills, accent hairlines), and
`--color-shade` (the one colour darker than the ground).

`@theme static`, not plain `@theme`, matters: Tailwind prunes theme variables no utility
references, and most of the derived tokens are read by hand-written CSS and inline styles
rather than by a class.

Standing rules:

- **Exactly one saturated accent** (orange). If a second functional colour is ever
  needed for "secured" states, derive it from the primes — don't add a fifth.
- **No glow.** No `box-shadow` as a halo, no coloured blur. Depth comes from an offset
  directional shadow or a flat surface step.
- **Off-white, never `#fff`.** Use `--color-ink` wherever pure white is tempting.
- **Do not reuse the Premier League palette** (`#37003C` / `#00FF87`) — #footydraft
  spans multiple leagues and hasn't earned those colours.

### Typography

**Only Oswald and Inter. Project-wide, no exceptions except logos.**

**Oswald** (condensed, mostly uppercase) for buttons, labels, section titles and every
number — bid amounts, countdowns, position codes — with `tabular-nums` so ticking values
don't jitter. **Inter** for body copy, inputs, and helper text.

The one carve-out is the **logo**, where the face is free. The home page's wordmark is
set in **Bebas Neue** on that basis and is the only element in the app allowed to use it;
it has its own token (`--font-wordmark`) so nothing else can reach for it by accident.

### Interaction rules

- **The page never scrolls.** Screens are `100dvh` with `overflow: hidden`; display type
  is sized with `min()` against both `vw` and `vh` so a short viewport compresses rather
  than overflows. Verified down to 320×568.
- **No I-beam over anything non-editable.** Global `cursor: default`, `text` on real
  inputs only, plus `user-select: none` on chrome text.
- **`pointer` covers the whole of an interactive, label included.** The global
  `* { cursor: default }` matches a `<span>` inside a `<button>` just as well as the
  button, so the cursor rules list descendants explicitly (`button, button *, …`).
  Without that the cursor flicks back to an arrow the moment it crosses the text.
- **Motion is abundant but small.** This should feel like a well-made modern site or a
  game, not a 2004 page: a sequenced initialisation on load, ambient movement that never
  fully stops, and a considered transition on every state change. All of it is
  **compositor-only** — `transform`, `opacity` and `clip-path`, no per-frame JS — so it
  never contends with the real-time updates coming later. Nothing overshoots, nothing
  bounces, and everything collapses under `prefers-reduced-motion`.
- **Nothing jumps under the pointer.** Hover states change colour, draw a rule, or slide
  an affordance in; they don't translate the thing you're about to click.
- **Dead ends stay honest.** Unbuilt actions say so in a status line; no fake spinners.
  Disabled controls carry a visible reason.

### Backdrop

One band, inert and painted behind everything (`StadiumPlate.tsx`): a full-bleed
monochrome stadium plate at 36% opacity, zoomed past the frame so the pitch and its
corner flag stay below the fold. It is masked down hard over its top third — which turns
the blank sky into a roofline silhouette rather than a bright slab behind the wordmark —
and dissolves at the bottom into the ground colour. A `mix-blend-mode: color` layer tints
it with `--color-tint`, keeping the photo's own luminance and taking only hue and
saturation, so it sits in the palette's colour family instead of reading as neutral grey.

It **drifts** on a 54-second scale-and-translate loop. Slow enough that you never catch
it moving, enough that the page is never a still image.

There is **no line grid**. An earlier pass had one (64px cells at 8% ink); it was cut on
2026-08-17 — with the stadium behind the type doing the texture work, the grid only added
noise.

### Art assets

Club and league crests as SVG (`/clubs/{slug}.svg`) don't exist yet and still fall
through on load error to a generated SVG stand-in (`src/lib/placeholderImage.ts`).

Player photos are real, for 545 of the 546 players in `player_data.csv`, at
`public/players/{slug}.webp` — `PlayerImage` already points every player at this path,
so nothing else needed to change when the files landed. The one gap is
`ederson-atalanta` (the CSV has two different players named "Ederson"; only one photo
was ever fetched and it's unambiguously the other one, the Fenerbahçe keeper — see
`scripts/process_player_images.py`'s docstring). It falls through to the SVG stand-in
until a distinct photo is fetched for him specifically.

These are **deliberately uncropped and unresized** — full original resolution, each
photo's native aspect ratio intact (an earlier pass force-cropped everything to the
marquee card's one aspect ratio at ingest time, which was wrong: that's a decision for
whatever UI is doing the displaying, not something to bake in once for every future
consumer). Whatever crop a given layout needs should happen at that layout, not here.
Total is ~249 MB across 545 files — noticeably more than the rest of this repo, and a
real cost of that decision; revisit if it becomes a problem (git-lfs, a CDN, or
per-use-case derivatives generated from the face boxes below are all on the table).

To help with that future cropping, `face_coordinates.json` has a hand-marked bounding
box per player — `{ x, y, width, height, imageWidth, imageHeight }`, all in that
player's own image's pixel space — locating their face, so a later smart-crop can anchor
on it instead of guessing. Marked by hand against `public/players/`; the tool used to do
it was a throwaway local HTML page, not worth keeping once the data existed.

**`public/faces/` is the first consumer of that data.** `scripts/make_face_crops.py`
reads a player's face box, cuts a 4:5 portrait around it such that the face occupies a
fixed 42% of the crop's height (anchored at 44% from the top, so there's room for
shoulders), and writes a 256×320 WebP. The point is that a set of them reads as one
consistent set rather than a dozen photos that happen to contain a person. Twelve are
shipped, at ~10 KB each against the ~250 KB originals — which is what makes putting them
on a page that has to paint immediately affordable. The roster lives at the top of the
script; `src/data/wallFaces.ts` names which of them the home page cycles through, so
adding a player means editing both and re-running the script.

Player photos are fetched via `save_player_images.py` (`run_save.bat`) — semi-automatic:
it drives the browser through a Google Images search per player and waits for a manual
click on the right thumbnail, since no fully-automatic heuristic proved reliable enough
to trust unattended. Raw fetches land in `assets/` (gitignored, kept locally as the
archive) and `scripts/process_player_images.py` converts whichever ones match
`player_data.csv` into the `public/players/{slug}.webp` files actually shipped.

The other real asset in the build is the backdrop, `public/stadium.webp` (234 KB). It is
referenced through `import.meta.env.BASE_URL`, not a leading slash, so it survives being
served from a GitHub Pages project subpath, and it is preloaded in `index.html` so it
doesn't wait on the bundle.

It is derived from a 4.9 MB, 8561×5707 photograph that is **deliberately not in the
repo** — kept in the same gitignored `assets/` as the player photo sources. Keep raw
source art outside version control and commit only the shipped derivative. The
transform, should it need regenerating from an equivalent source (Pillow): crop to the
**22–80% vertical band** — the only part `object-cover` ever shows, so the blank sky and
foreground grass are dropped — then `.convert('L')`, resize to **2400px wide** with
LANCZOS, and save at `quality=76, method=6`.

### Built so far

**The home page, and nothing else.** The previous home page and the previous lobby were
deleted on 2026-08-17 — along with the router, since one page doesn't need one. `App.tsx`
renders `Home` directly. `react-router-dom` is still in `package.json`, unimported, for
when the lobby comes back; it brings a `HashRouter` with it when it does, because GitHub
Pages has no rewrite rules.

Home is a single `100dvh` viewport, top to bottom:

- A **tagline** left, and `11 slots · 546 in the pool · 4-2-3-1` right.
- The **wall** — `FOOTY` over `DRAFT`, two five-letter lines stacking into a near-solid
  rectangle, with the stadium clipped into the letterforms via `background-clip: text`.
  The same photograph is the fill here and the ground behind it. Sized off image *height*
  (`background-size: auto 240%`), not width — sizing off width let it fall short
  vertically and tile, which put a second horizon halfway down DRAFT.
- A **cycling portrait** in the negative space to its right, moving through twelve
  players every 3.8s with a hairline ticking down the hold. All twelve are in the DOM and
  cross-fade on opacity; swapping `src` meant watching each new crop decode. Hidden below
  `sm`, where the wordmark needs the whole width.
- **SINGLE PLAYER** in orange over a thin rule, then the **four formats** as four equal
  tiles. Hovering one fades the title below out and its description in. Clicking one is
  meant to open the single-player lobby.
- **PLAY WITH FRIENDS** in the same orange, a hairline, then **Create a lobby** (orange,
  owning the left edge on its own) against a **room code** field and a quieter **Join
  lobby** pushed right.
- A reserved status line under everything.

**Every action is an honest dead end.** No lobby exists, nothing is wired to Firebase, so
each control reports that in the status line rather than faking a destination.

The page **initialises as one sequenced move**, ~1.3s end to end: the plate scales in, the
wall is printed left-to-right by a `clip-path` wipe with an accent hairline riding its
edge, then the portrait, the rules (which draw rather than appear), the tiles and the bar
stagger in underneath.

Design decisions were run through the **Hallmark** skill (`.claude/skills/hallmark/`);
the run is logged at `.hallmark/log.json`.

Verify with `npm run build` (typecheck + build), `npm test` (Vitest smoke test), and
`npm run dev` for the real thing.

### The exhibition it came from (2026-08-17, `frontend-retry`)

The home page's look was reopened from scratch as a first-look exercise: *assume the
current design doesn't exist, build something else beside it.* The exhibition below is
what came out, and **layout 04 on the petrol palette is what shipped** — see Built so far
above. The other nineteen stay in the file, same as the lobby gallery did.

**Where:** `mockups/home.html`. Same self-contained exhibition shell as
`mockups/lobby.html` — a grid of 1280×800 frames at half scale, click any frame to zoom
it to full width. Opens straight off disk (`file://`); no build step, no server.

**Twenty layouts**, one per Hallmark macrostructure (all 21 except Feature Stack, which
needs scroll — and this app never scrolls):

01 Kickoff · Marquee Hero — 02 Team sheet · Index-First — 03 Four ways · Bento Grid —
04 The wall · Type Specimen — 05 Matchday · Photographic — 06 The programme · Long
Document — 07 Turnstile · Split Studio — 08 Eleven · Map / Diagram — 09 Draft order ·
Narrative Workflow — 10 The ledger · Stat-Led — 11 Chalkboard · Manifesto — 12 The pick ·
Catalogue — 13 Broadsheet · Specimen — 14 Terminal · Component Playground — 15 Tunnel ·
Workbench — 16 Ask · Conversational FAQ — 17 Note · Letter — 18 Ninety · Quote-Led —
19 The board · Ecosystem Index — 20 Cutout · Portfolio Grid.

Eleven display faces are rotated across them (Anton, Bebas, Oswald, Archivo, Big
Shoulders, Instrument Serif, Fraunces, Newsreader, Space Grotesk, Syne, IBM Plex Mono),
each with its own nav and footer voice. No motion anywhere — first-look only.

**Palettes.** Every frame carries five palette buttons under its caption, plus a header
row that flips *all twenty* frames to their 1st/2nd/…/5th palette at once (or rolls at
random). The mechanism: a shared pool of **20 palettes declaring 4 primes each**
(`--ground --ink --accent --tint`, plus a photo filter on the light and mid grounds);
every other colour in the file — surfaces, hairlines, muted text, accent-ink, shades —
derives from those four via one `color-mix(in oklab, …)` block written once. Each layout
names five palettes from the pool by slug, so 100 distinct looks come out of 20
definitions. Palettes are defined on the bare `[data-pal='x']` attribute rather than on
`.frame`, so the swatch buttons carry the attribute themselves and paint *from the same
rule* — the chips are the palette, not a hand-matched approximation of it.

Pool: 10 dark (floodlight, terrace, astro, vidiprinter, awaystrip, cinder, nightwatch,
pitchink, copperpot, petrol), 6 light (broadsheet, chalk, kitwhite, sundayleague,
programme, linen), 4 mid (concrete, grass, claret, tarmac).

**Stadium.** `public/stadium.webp` appears in all twenty and bleeds into the ground in
twenty different ways — vignette, horizon sliver, `background-clip: text`, dot-matrix
halftone, scanlines, posterised duotone, mirrored corridor, rotated band, radial
spotlight, and so on. Four frames also use real player photos from `public/players/`.

**Copy is honest** — 11 slots, four formats, 2–5 drafters, 546 in the pool, 15s default
turn, auction backfill. No invented metrics anywhere, per the rules in this document.

**Status: resolved.** Layout **04 · The wall** (Type Specimen) on **petrol** was picked
and ported. What shipped is not a transcription of the frame — the exhibition is
motionless and has no real controls, so the port re-cut the formats as four equal tiles
under a titled rule, split the lobby controls create-left / join-right, dropped the
frame's `⌘K` (there is nothing to search) and its line grid, added the whole motion layer,
and swapped the frame's Bebas/Space Grotesk pairing for Oswald and Inter — Bebas survives
on the wordmark alone, as the logo.

Design decisions for this pass were run through the **Hallmark** skill
(`.claude/skills/hallmark/`); the runs are logged at `.hallmark/log.json` so a future run
in this repo picks different macrostructures.

## Configuration Mechanics

Every draft is configured along three independent axes: **Format**, **Scope**, and
**Constraints**.

### Formats

#### Auction
3 example players: John, Paul, Ringo. Each starts with a budget (e.g. 1B euros). A
footballer comes up starting at a predetermined starting value (not 0). Players bid in
real time; if no one bids, the footballer is gone. Highest bidder wins and can slot the
footballer anywhere they're eligible in their current 11, and can rearrange their
formation in real time.

Every purchased footballer goes into the buyer's **graveyard** — a holding area of
purchased-but-unused players, not substitutes, not part of the final list. Players
place footballers from their graveyard into their formation as desired. The graveyard
lets a player upgrade their lineup or block opponents from getting certain footballers.
The graveyard is **unlimited** — no cap on how many footballers can sit in it, no extra
cost beyond the winning bid. *(R1-Q7)* Bidding is **not gated by slot status** — a
player with an already-full XI can keep bidding for graveyard upgrades or purely to
block opponents, right up until the auction ends. *(R5-Q6)*

**Running low on money — backfill, not a reserve** *(R1-Q1 → overturned by R2-Q4)*: no
funds are held back during bidding — it stays a genuine free-for-all, anyone can bid
whatever they have at any time. Instead, once the auction **runs its course** (defined
as: every remaining footballer in the pool has been through the block, *or* every
player still short of a full XI can no longer afford any unsold eligible footballer for
their open slots — whichever comes first), any player left with empty slots has them
auto-filled with the **cheapest still-eligible unsold footballers** for those
positions. Running out of money isn't prevented, it's just not punished with a
permanently broken squad — you end up with worse players, not fewer players. This is
also the default behavior when a pick/bid timer expires unattended (see Turns &
Timers). Deal or No Deal has no budget in the briefing, so "running out of money"
doesn't apply there.

There's **no designated opener/nominator** — any footballer can be bid on by anyone the
moment it appears, no rotating turn to bring it up. *(R2-Q5)* Footballers surface
**one at a time**: the system auto-reveals the next one as soon as the current one
sells or passes. *(R3-Q1)* The reveal order is **fully random** — no quality curve,
best/worst-first, or position cycling. *(R6-Q1)*

Bid increments are **flat, stepped amounts**, offered as a small fixed set of buttons
(e.g. +1M / +5M / +10M) available at every price point — the steps don't scale up with
the current price. *(R2-Q3, R3-Q9)* A footballer's **starting (opening) bid** is **70%
of its derived market value, rounded to the nearest 5M** — see Player Data Pool below
for how that market value is derived. *(R2-Q2, resolved on the `valuations` branch,
2026-08-15)*

The auction "runs its course" (triggering the backfill) as a **hard, global stop**: the
moment every remaining player is unable to afford anything more, the auction ends
immediately for everyone at once — it doesn't wait for individual players to trail off
one by one. It also ends once every footballer in the pool has been sold or passed on,
whichever comes first. *(R3-Q10)* A well-funded player with a full XI can, by design,
keep the auction running indefinitely purely to deny others — **no cap, no escalating
cost** on blocking bids. Intended strategy, not an exploit to guard against. *(R6-Q7)*

**Open:** how footballers are chosen for the pool in general, beyond guaranteeing
position coverage (Q2 settles coverage; Round 2 settled a quality skew — see Player
Data Pool below).

#### Deal or No Deal
3 example players: John, Paul, Ringo. One position is picked at random (e.g. CDM).
There are `n*2` boxes (6 for 3 players), each containing a footballer eligible for that
position. Players open boxes in turn order and choose to **stick** or **hear the
offer**. After everyone has opened once, an AI proposer offers a player (not in any
box) to each player who chose to hear the offer, based on the quality of the remaining
unopened boxes. Each offered player can **take it** or **go back to the boxes**. If
they go back, the next box they open is the player they must take. Round ends; a new
position is picked at random and the turn order rotates — a **strict round robin**
through every player in a fixed order, one round each. *(R5-Q7)*

**No graveyard** — overturning the briefing's original wording. With exactly 11 rounds,
each mapped to one designated position, every round's result (stick, take the offer, or
go back to the boxes) fills that round's slot directly. There's no purchased-but-
unplaced surplus to hold, so a graveyard has nothing to do. *(R3-Q2)*

This format has no budget/currency in the briefing — every player is guaranteed a
footballer each round, so it's self-completing by design. *(R1-Q1)*

The AI proposer's offer is **deliberately a bit worse** than the average ability of the
remaining unopened boxes for that round's position — sticking with the boxes should
feel like the tempting choice, taking the deal a concession. *(R3-Q4)* That calculation
is **flat and position-based only** — the same for whoever it's offered to that round,
not adjusted per-player for squad needs, budget, or history. *(R6-Q8)*

That round's boxes themselves follow the **same higher-ability skew** as the rest of
the pool (see Player Data Pool) — they aren't pulled evenly/representatively just
because they're boxes. *(R6-Q2)*

**Open:** how footballers are chosen for the pool in general, beyond position coverage.

#### Free Pick
3 example players: John, Paul, Ringo. Straight **snake draft**, 11 picks total, each
player freely picking any footballer in the pool on their turn. **No graveyard.**
Self-completing by design (11 picks = 11 slots). First pick order is a **random draw**
at draft start. *(R2-Q6, also applies to Spin the Wheel below)*

This is the **only format that supports Constraints** — see Constraints below.
Footballers that would break a player's constraint are **filtered out of what they can
even select** during their turn, not just blocked on attempt. *(R5-Q2, R5-Q9)* A
constraint is checked **per player's own squad only** — "1 per club" means *you*
personally can't have two from the same club, it says nothing about what anyone else
in the lobby ends up with. *(R6-Q3)* Whether the filter could ever leave a player with
zero legal options for a position they still need is believed unlikely to happen in
practice (given the pool's guaranteed position coverage); no explicit fallback rule is
defined for that edge case yet. *(R6-Q4)*

#### Spin the Wheel
The wheel is **never mixed** — no single wheel has club slices next to league slices
next to nationality slices. Every spin's wheel is entirely one category: all clubs, all
leagues, or all nationalities. *(R4-Q6, overturning the mixed-wheel reading of R3-Q3)*
Whichever single category is in play, the pick itself is a free pick in a snake draft.

Which one category applies is still governed by Scope — whichever of **league / club /
nationality** the current Scope *hasn't already fixed* is eligible to be the wheel's
category: Scope = All players or Top 5 Leagues leaves all three eligible; one specific
league fixes league, leaving clubs or nationalities as options; one specific nationality
fixes nationality, leaving leagues or clubs. *(R3-Q3)* That category is picked **once,
at the very start of the draft** — the whole draft uses that one category type
throughout, it doesn't change between spins. *(R5-Q1)*

The wheel is spun before every pick. If the wheel lands on a category with no eligible
footballers left, that turn **falls back to a free pick from the full remaining pool**
— just for that turn, the wheel category isn't removed and play resumes normally next
turn. *(R2-Q4)*

**No graveyard**, same as Free Pick — it's a picking format, not a bidding one. *(R3-Q2)*
First pick order is a **random draw**, same as Free Pick. *(R2-Q6)* **No Constraints**
support — that's Free Pick only. *(R5-Q2)*

### Scope
Four values: **All players**, **Top 5 leagues**, **one specific league**, **one
specific nationality**.

### Constraints
Four possible values: **1 per club**, **3 per club**, **1 per nationality**, **3 per
nationality**. Exactly **one** constraint is active per draft — they don't stack. *(R1-Q8)*

Constraints only apply to **Free Pick** — Auction, Deal or No Deal, and Spin the Wheel
all skip Constraints entirely. *(R4-Q1/Q2 → narrowed by R5-Q2)* The setting simply
**isn't offered** for the other three formats — not shown, not silently ignored.
*(R5-Q2)*

### Lobby Size
**2–5** drafters (humans + bots combined), no minimum-to-start beyond 2. The size isn't
chosen up front — the lobby leader starts whenever ready and the headcount is whatever
has joined by then. *(R1-Q3, resolved: the earlier "10" was a slip, R2-Q1)*

### Single-Player
A solo human picks how many bots fill out the rest of the lobby at setup, within the
normal 2–5 range — there's no fixed "always max" or "always 1v1" default. *(R3-Q7)*
Bots are **always added manually** by a human (the host), the same way a human player
would be invited — there's no auto-fill to pad an under-full lobby. *(R5-Q5)*

### Lobby Setup & Lifecycle
Only the **lobby leader/host** chooses Format, Scope, and Constraints — nobody else in
the lobby can act on that choice. *(R5-Q4)* Once a draft finishes, the **lobby stays
open**: the same group can immediately start another draft with new settings, no fresh
invite link needed. *(R5-Q10)* Nothing carries over between back-to-back drafts in the
same lobby — each new draft is a **completely clean slate**, bots included (re-added
manually each time), same as a brand-new lobby. *(R6-Q10)*

If the host disconnects or leaves, host status **automatically passes** to whoever
joined the lobby next earliest — no vote, no gap in leadership. *(R6-Q6)*

### Squad Completion Guarantee
A draft can **never** end with an unfilled slot in the 4-2-3-1 — every format must
produce a complete XI. *(R1-Q5)* This is already true by construction for Deal or No
Deal, Free Pick, and Spin the Wheel (each cycles exactly 11 times, one slot per turn).
Auction is the only format that could otherwise leave gaps — it's covered by the
backfill-with-cheapest-eligible-footballers rule above, not by preventing low-money
bidding in the first place.

### Turns & Timers
Host-configurable per-turn/bid timer (a length can be set, or timers can be turned off
entirely), defaulting to **~15 seconds** before a host changes it. *(R1-Q6, R6-Q5)* On
timeout, the system defaults to the **least-committal, no-help option** rather than
picking something good on the player's behalf — consistent with
the Auction backfill philosophy (stalling gets you scraps, not a curated pick):
- **Auction:** no special handling needed — bidding just closes without that player's
  input if they don't act.
- **Deal or No Deal:** stick/hear-the-offer defaults to **stick**; take/go-back-to-the-
  boxes defaults to **take the offer**. Both avoid introducing more randomness.
- **Free Pick / Spin the Wheel:** auto-picks the **cheapest eligible remaining
  footballer** for that slot — mirroring the Auction backfill rule. *(R2-Q7, decided by
  Claude; first-pass rule, may get refined later)*

### Disconnection & Reconnection
A player who drops mid-draft gets replaced by a bot after **45 seconds** disconnected.
*(R3-Q6, R4-Q3)* If they reconnect later in that same draft — even after the bot took
over — control **always hands back to them immediately**. *(R4-Q4)*

### Bots
Bots always play **one consistent default style** — no personality/aggressiveness
picker exposed to players. *(R1-Q9)* The actual decision logic (how a bot bids,
sticks, takes offers, etc.) is **explicitly deferred** — not to be speced out yet.
*(R2-Q8)*

### Comparing Squads
No numbers, no leaderboard — just a **pure side-by-side visual** of both finished
formations. *(R2-Q9)* The graveyard is **fully private** — only the final XI ever
appears in sharing or comparison, never the graveyard contents. *(R5-Q8)*

### Squad Sharing
"Squads can be shared" (Overview) means a **downloadable/shareable image** — a lineup
graphic — of the finished squad. Not a link, not a screenshot players take themselves.
*(R3-Q5)* Per player it shows **name, position, and a small headshot/portrait** of the
footballer (exact asset TBD — the game is expected to accumulate a larger art asset
library over time). *(R4-Q5, R5-Q3)* It's **manually triggered** — a player clicks
"export" whenever they want one, not auto-generated the instant a draft ends. *(R6-Q9)*

### Lobby Chat
Chat stays **fully active at all times**, with no restrictions or secondary treatment
during fast-moving formats like Auction. *(R4-Q7)*

### Lobby Privacy & Spectators
Lobbies are **invite-link only** — no public lobby browser/listing. *(R4-Q8)* There is
**no spectator mode** — everyone in a lobby is a drafter. *(R4-Q9)*

### Player Data Pool
Beyond guaranteeing every position has enough eligible footballers, the pool should
**skew toward higher-ability players** so drafts feel star-studded rather than
strictly representative of the full Scope. *(R2-Q10)* Every draft starts **completely
fresh** from the full pool — no memory of footballers used in past drafts, per-lobby or
site-wide. *(R4-Q10)*

**Current Ability calibration:** the original per-player ratings were cross-checked
against two independent rounds of AI deep-research groupings — players judged to be of
equal real-world caliber as of August 2026, grouped in threes (`gemini_quizzes/`) —
then refit with a regularized least-squares pass: each player is pulled toward
agreement with whoever they were grouped with, weighted by how much evidence exists for
them, while staying anchored to their original rating so weakly-evidenced players barely
move. Pre-calibration values are preserved in `player_data_ability_backup.csv`.

**Derived market value → Auction opening bid:** a small real-world price sample (56
age-27 players, manually researched) was fit to an exponential curve in ability
(`price ≈ 0.0134 × e^(0.0512 × ability)` million EUR, anchored so Mbappé = 200M),
producing a **Derived Price (EURm)** for every player. **Auction opening bids** are
`Derived Price × 0.7`, rounded to the nearest 5M, stored as **Opening Bid (EURm)**.

### Post-Draft Editing
Once a draft ends, the **roster is locked** but players can still rearrange which
already-drafted footballer sits in which formation slot (positioning only, no
swapping/adding footballers). *(R1-Q10)*

### Multi-Position Eligibility
A footballer listed with several eligible positions (e.g. "AMF, RW, LW") still only
fills **one slot**, and only counts as one pick — but which of their listed positions
they occupy is **freely reassignable** afterward, consistent with the general
real-time-reformation and post-draft-positioning rules above (not locked in at draft
time). *(R3-Q8)*

## Player Data

`player_data.csv` is the footballer pool: name, nation, age, club, position(s), current
ability, league, plus derived **Derived Price (EURm)** and **Opening Bid (EURm)**
columns (see Player Data Pool above for how those are computed). Covers the top 5
leagues (Premier Division, Serie A, First Division, Bundesliga, Ligue 1) plus a number
of high-ability players from other leagues (Saudi Pro League, MLS, Eredivisie, Sky Bet
Championship, etc.).

**Known gap — CM depth.** Only 10 footballers in the whole file list CM as an eligible
position (8 of them inside the top 5 leagues); every other position has 39–146. CM is
therefore the binding constraint on which Scopes can support a draft at all — a single
league or nationality rarely has enough CMs for a 3+ drafter lobby, so those Scope
options are mostly unusable until more CMs are added to the data.

## Open Questions Log

Tracked and resolved via the questionnaire process — see `questionnaire_1.md` onward.
Each entry below is closed out (with the decision folded into the rules above) once its
questionnaire is answered.

~~1. Auction / Deal or No Deal: what happens when a player runs out of money or is very
   low on funds?~~ Resolved R1-Q1, revised R2-Q4: backfill with cheapest eligible
   footballers once the auction runs its course; N/A for Deal or No Deal.
~~2. How is the footballer pool selected per draft so all positions are covered?~~
   Resolved (pool is built position-by-position first, then combined; skewed toward
   higher-ability players per R2-Q10).
3. ~~How are footballers chosen for the pool in general?~~ Resolved R2-Q10 (skew toward
   higher ability). Still open: exact skew curve/weighting.
4. ~~Spin the Wheel: exact mechanics~~ — dry-category fallback resolved; wheel
   weighting/odds and full Scope interaction still open.
5. AI bots: game-facing decision logic is **explicitly deferred by design** — not to be
   speced out yet (R2-Q8). ~~Separately open: D-o-N-D AI proposer offer logic~~ Resolved
   R3-Q4 (deliberately a bit worse than the average remaining box).
~~6. Lobby size~~ Resolved: 2–5 (R2-Q1).
~~7. Turn/bid timer default behavior~~ Resolved, first pass (R2-Q7). ~~Default timer
   length~~ Resolved R6-Q5: ~15 seconds.
~~8. Auction: starting bid value formula~~ Resolved on the `valuations` branch,
   2026-08-15: opening bid = 70% of a derived market-value estimate (ability-based
   exponential fit, anchored to a real transfer-value sample), rounded to the nearest
   5M. ~~Bid increment step table~~ Resolved R3-Q9 (small fixed set of buttons, same at
   every price point).
~~9. Turn order~~ Resolved: Auction is a pure free-for-all, no nomination order (R2-Q5),
   footballers auto-reveal one at a time (R3-Q1); Free Pick / Spin the Wheel first pick
   is a random draw (R2-Q6).
~~10. What does "compare squads" show?~~ Resolved: pure side-by-side visual, no numbers
   (R2-Q9).
~~11. Precise definition of "the auction has run its course"~~ Resolved R3-Q10: hard,
    global stop the moment nobody left can afford anything, or the pool is exhausted.
~~12. Scope × Spin the Wheel~~ Resolved R3-Q3/R4-Q6: the wheel is single-category
    (never mixed), and Scope governs which categories are eligible to be that category.
~~13. Spin the Wheel: exact odds/weighting per category~~ Moot — R4-Q6 clarified the
    wheel is single-category. ~~How/when the one category is chosen~~ Resolved R5-Q1:
    once, at draft start.
~~14. Squad sharing image contents~~ Resolved R4-Q5/R5-Q3: name, position, small
    headshot/portrait per player; exact art assets still TBD.
~~15. Disconnection duration~~ Resolved R4-Q3: 45 seconds.
16. ~~Auction starting-bid formula~~ Resolved (see item 8). Pool selection weighting
    curve (exact skew toward higher ability, see item 3) is still open.
~~17. Constraints scope~~ Resolved and narrowed R5-Q2: Constraints only exist for Free
    Pick — not Auction, Deal or No Deal, *or* Spin the Wheel (R4's "and Spin the Wheel"
    was wrong, corrected here). The setting isn't shown at all for the other three.
~~18. Auction reveal ordering~~ Resolved R6-Q1: fully random.
~~19. D-o-N-D box quality~~ Resolved R6-Q2: follows the same pool-wide skew.
~~20. Constraint scope (per-squad vs. global)~~ Resolved R6-Q3: per-squad only.
21. Free Pick constraint deadlock (filter leaves zero legal options for a needed slot)
    — believed unlikely in practice (R6-Q4), but no fallback rule is actually defined.
    Revisit if it turns out to matter once pool-selection details (item 16) are nailed
    down.
~~22. Host transfer on disconnect~~ Resolved R6-Q6: auto-passes to next-earliest joiner.
~~23. Indefinite blocking bids in Auction~~ Resolved R6-Q7: intended, no cap.
~~24. AI proposer offer targeting~~ Resolved R6-Q8: flat/position-based, not per-player.
~~25. Squad-share export timing~~ Resolved R6-Q9: manually triggered.
~~26. Lobby carryover between back-to-back drafts~~ Resolved R6-Q10: nothing carries
    over, clean slate every time.

## Questionnaire Log

The raw `questionnaire_N.md` files were removed in the 2026-08-15 workspace cleanup —
every answer they contained was already folded into the rules above before removal.
This table is kept as a historical index of what each round covered.

| # | Topic | Status |
|---|-------|--------|
| 1 | Money, pool coverage, lobby size, timers, graveyard, constraints, bots, post-draft editing | Answered |
| 2 | Lobby size fix, Auction pricing/increments/turn order, timer timeout, D-o-N-D bots, squad comparison, pool quality | Answered |
| 3 | Auction reveal flow, wheel/scope/graveyard interactions, D-o-N-D offers, sharing, disconnects, single-player, multi-position slotting, bid steps | Answered |
| 4 | Constraint enforcement, disconnect/reconnect timing, share image contents, wheel odds, lobby chat/privacy/spectators, pool freshness | Answered |
| 5 | Wheel category timing, constraint scope clarification, share-image asset, format/scope selection, bot auto-fill, Auction bidding-after-full-XI, D-o-N-D rotation, graveyard visibility, lobby lifecycle | Answered |
| 6 | Auction/D-o-N-D reveal-quality ordering, constraint scope (per-squad vs global), Free Pick constraint deadlocks, default timer length, host transfer, indefinite-blocking bidding, AI proposer targeting, share-image timing | Answered |
| 7 | TBD | Pending |
| 8 | TBD | Not started |
| 9 | TBD | Not started |
| 10 | TBD | Not started |
