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

Round 7 ran 2026-08-18 on the **`position-reform`** branch: every player's
multi-position tag was replaced with a single canonical position, decided across three
questionnaire rounds and applied to `player_data.csv` in one delivery. See Position
Reform under Multi-Position Eligibility below.

That reform made positions a hard gate, which in turn made it worth measuring which
draft configurations can still be played at all. The **`draft-viability`** branch
(2026-08-18) simulated every configuration against the real pool, withdrew the
nationality Scope on the strength of it, and gated both lobby panels on the result —
see **Draft Viability** below.

The frontend build began on 2026-08-15 (`frontend` branch). On 2026-08-17 the home
page's visual direction was reopened on the **`frontend-retry`** branch, a 20-layout
exhibition was built beside it (`mockups/home.html`), and layout **04 "The wall"** on the
**petrol** palette was picked. The old home page and the old lobby were then **deleted
outright** and the home page rebuilt from that layout — see Frontend below. No Firebase
wiring and no bot decision logic exist yet — both remain deliberately deferred.

Work on the **single-player lobby** opened on the **`singleplayer-lobby`** branch on
2026-08-17. Same first-look method as the home page: an exhibition of lobby layouts was
built beside the app (`mockups/lobby-solo.html`), **layout 04 "Ready room" was picked**,
and it has since been **ported into `src/`**. See The single-player lobby below.

The **multiplayer lobby** followed on the **`multiplayer-lobby`** branch, same day, with
**no exhibition** — it is the friends-facing cut of the same Split Studio diptych, so it
was built directly off the single-player screen. It brought the **fake-functionality
rule** with it (see Interaction rules): with no Firebase behind it, the lobby simulates
the room rather than announcing the gap. The site has **three routes** now.

The **`seamlessness`** branch, cut from `main` on 2026-08-18, hoisted the ambient stadium
backdrop into a root `AppShell` (keeping the 30s ambient drift animation continuous across
page navigation without restarting keyframes), extracted a shared `LobbyLayout` diptych
organism for solo and multiplayer lobbies, and standardized UI primitives (`Button`,
`StatusLine`, `SectionLabel`). That branch was committed, pushed and merged to `main` on
2026-08-18. All work described below is now on `main`.

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

### Copy

**Professional, matter-of-fact, descriptive.** Labels name the thing, helper text
describes the effect. No voicey microcopy, no winking asides, no invented jargon — the
interest comes from the structure and the motion, not from the words. *(Set by Mert,
2026-08-17.)*

**Internal facts about the data model never appear on screen.** No pool counts, no
per-position depth, no reference to the CM gap, no acknowledgement that there is no
scoring system. These are implementation state, not product; putting them in the UI turns
a to-do into a permanent-looking limitation. Design as though the data is complete.

**No format is the default.** Auction, Deal or No Deal, Free Pick and Spin the Wheel carry
equal weight in every layout, every ordering and every piece of copy. Where a screen needs
one selected and none was chosen, it selects **none** rather than picking a house
favourite.

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
- **Motion is abundant but small, and it stays in the quiet register.** A sequenced
  initialisation on load, ambient movement that never fully stops, and a considered
  transition on every state change — rendered as **smooth, simple fades** with a little
  travel, not as choreography. *(Preference set by Mert, 2026-08-17: the home page's
  wipe-and-stagger was judged fine but the simpler end of the range is what he wants
  going forward.)* All of it is **compositor-only** — `transform`, `opacity` and
  `clip-path`, no per-frame JS — so it never contends with the real-time updates coming
  later. Nothing overshoots, nothing bounces, and everything collapses under
  `prefers-reduced-motion`.
- **Nothing jumps under the pointer.** Hover states change colour, draw a rule, or slide
  an affordance in; they don't translate the thing you're about to click.
- **Fake the functionality.** *(Project-wide, set by Mert 2026-08-17, replacing the
  earlier "dead ends stay honest" rule.)* Where a screen needs a backend that doesn't
  exist yet, **the screen simulates it** rather than announcing the gap in a status line.
  People join the lobby on a stagger and take real seats; chat arrives and sends; a room
  code you were handed already has a host and settings behind it. The point is that the
  screen reaches its real states now, so the wiring drops in behind a UI that already
  behaves — and so the thing can be judged as a product rather than as a scaffold.
  Disabled controls still carry a visible reason, because a disabled control is a real
  state rather than a confession. The one thing not faked is a **destination that doesn't
  exist**: `Kick off` can't navigate to a draft screen that hasn't been built, so it says
  so.

### Backdrop

One band, inert and painted behind everything (`StadiumPlate.tsx`): a full-bleed
monochrome stadium plate at 36% opacity, zoomed past the frame so the pitch and its
corner flag stay below the fold. It is masked down hard over its top third — which turns
the blank sky into a roofline silhouette rather than a bright slab behind the wordmark —
and dissolves at the bottom into the ground colour. A `mix-blend-mode: color` layer tints
it with `--color-tint`, keeping the photo's own luminance and taking only hue and
saturation, so it sits in the palette's colour family instead of reading as neutral grey.

It **zooms**, slowly, on a 30-second loop — scale only, anchored a little below centre
(the 3/4 point, not dead-on) rather than translating around, growing just enough
(1.26× → 1.32×) to read as a slow push rather than a static shot. It fades to invisible
and back in right at the loop's boundary, so the reset to frame one crossfades instead of
jumping. *(An earlier 54s/20s scale-and-translate version was replaced with this
single-axis zoom-crossfade on 2026-08-17.)*

There is **no line grid**. An earlier pass had one (64px cells at 8% ink); it was cut on
2026-08-17 — with the stadium behind the type doing the texture work, the grid only added
noise.

### Art assets

**Club and league crests are real, as SVG, and they are the one licensed exception to
the four-prime palette.** 69 club crests at `public/clubs/{slug}.svg` and 5 league marks
at `public/leagues/{slug}.svg` (`premier-league`, `serie-a`, `la-liga`, `bundesliga`,
`ligue-1` — 2–8 KB each, 2.5 MB for the clubs).

**Never recolour, grayscale, or silhouette a crest** — settled by Mert on 2026-08-17. A
recoloured badge is a falsified badge. They render full colour and unfiltered, which
means the burden falls the other way round: whatever surface a crest sits on stays quiet
enough that the crest reads as inlay rather than noise. This is the *only* place in the
app allowed outside the four primes; the one-saturated-accent rule still governs
everything the app draws itself.

Coverage is the top five leagues only — 69 crests against 112 clubs in
`player_data.csv`. **Clubs outside the top five have no crest and are not getting one:
draw a ring (a bordered circle) in the same footprint instead.** League scope maps
`la-liga.svg` → the CSV's "First Division", `premier-league.svg` → "Premier Division",
`ligue-1.svg` → "Ligue 1 Uber Eats".

Anything still missing falls through on load error to a generated SVG stand-in
(`src/lib/placeholderImage.ts`).

`scripts/process_club_logos.py` is what produced them — it imports from an external
Wikipedia-sourced logo dump (kept outside the repo, like the other raw source art),
maps CSV club names to Wikipedia article filenames through a hand-built table, and
compresses in two stages: downsample any embedded raster the export wrapped, then `svgo
--multipass --precision=1`. Clubs that aren't in the top-five-league rows are left on the
placeholder deliberately, which also absorbs CSV noise (River Plate filed under "Premier
Division").

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

**The home page, the single-player lobby and the multiplayer lobby.** `App.tsx` is a
`HashRouter` over `/`, `/solo/:formatId` (plus a bare `/solo`) and `/lobby/:code`, with a
catch-all back to home. The hash is not a preference: GitHub Pages serves static files
with no rewrite rules, so a deep link that isn't in the hash 404s on refresh — and
`/#/lobby/KX7QD` is the invite link, so it has to survive being pasted.

Home is a single `100dvh` viewport, top to bottom:

- A **tagline** left, and `11 slots · 546 in the pool · 4-2-3-1` right.
- The **wall** — `FOOTY` over `DRAFT`, two five-letter lines stacking into a near-solid
  rectangle. The letterforms are filled via `background-clip: text` with a player face
  crop from `public/faces/` (named in `src/data/wallFaces.ts`), cycling through twelve
  players every 3.8s, cross-fading between them — grayscale, one `background-size: cover`
  image per instance, no tiling. The stadium plate is a separate layer behind everything,
  not the wordmark's fill.
- A short **description** — "Draft. Argue. Repeat." plus a two-sentence blurb — in the
  negative space to the wordmark's right, where an earlier cycling-portrait carousel used
  to live before the face-cycling moved into the wordmark itself. Hidden below `sm`,
  where the wordmark needs the whole width.
- **SINGLE PLAYER** in orange over a thin rule, then the **four formats** as four equal
  tiles. Hovering one changes its border/fill colour and grows a rule along its bottom
  edge — no title/description swap; per-format descriptions were dropped in an earlier
  pass. Clicking one is meant to open the single-player lobby.
- **PLAY WITH FRIENDS** in the same orange, a hairline, then **Create a lobby** (orange,
  owning the left edge on its own) against a **room code** field and a quieter **Join
  lobby** pushed right.

**Every control on the page goes somewhere.** A format tile opens the single-player lobby
on that format. **Create a lobby** mints a five-character room code; **Join lobby** takes
whatever code is in the field. Both stop at the same **name gate** — a modal `<dialog>`
over the home page — and then open `/#/lobby/:code`. The reserved status line under the
bar is gone with the dead ends it used to carry.

The page **initialises as one sequenced move**, ~1.3s end to end: the plate scales in, the
wall is printed left-to-right by a `clip-path` wipe with an accent hairline riding its
edge, then the description, the rules (which draw rather than appear), the tiles and the
bar stagger in underneath.

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

**On re-using macrostructures:** exhibitions are Mert's own picking tool, not production,
and only one layout per exhibition is ever ported. Hallmark's diversification rule is
therefore **relaxed in this repo** — a later exhibition may re-use macrostructures the
earlier ones consumed. Don't burn effort inventing a shape to satisfy the rotation. *(Set
by Mert, 2026-08-17.)*

### The single-player lobby exhibition (2026-08-17, `singleplayer-lobby`)

**Where:** `mockups/lobby-solo.html`. Same self-contained gallery shell as the other two —
1280×800 frames at half scale, click one to zoom to full width, opens straight off disk,
no build step and no server.

**Two deliberate differences from the home exhibition**, both because that run proved the
point already:

- **The palette is fixed.** Petrol only, no swatch buttons, no global palette row. The
  palette question is settled project-wide, so re-asking it per frame was noise.
- **Type is held to Oswald + Inter**, with Bebas Neue only where a frame draws the
  wordmark — i.e. the production law, not the eleven rotating display faces the home
  exhibition used. That made the home run harder to judge: the face had to be mentally
  stripped out of every frame before comparing shapes, and it got swapped for
  Oswald/Inter on the port anyway. Here per-frame voice comes from case, tracking, weight
  and scale knobs (`.l01`–`.l15`), so **every difference between frames is structural** and
  whatever gets picked ports without a type swap.

**Fifteen layouts, not twenty.** Twenty were planned, one per macrostructure; the run was
stopped at fifteen because the winner was already obvious. 01 Team sheet · Long Document —
02 Four doors · Bento Grid — 03 The pitch · Map/Diagram — **04 Ready room · Split
Studio** — 05 The board · Index-First — 06 The card index · Catalogue — 07 Five four six ·
Stat-Led — 08 Note · Letter — 09 Turnstile · Marquee Hero — 10 Chalkboard · Manifesto —
11 Dugout · Photographic — 12 The console · Component Playground — 13 Rulebook ·
Conversational FAQ — 14 Ninety · Quote-Led — 15 Order of play · Narrative Workflow. Layouts
16–20 (Type Specimen, Ecosystem Index, Portfolio Grid, Workbench, Specimen) were never
built and are not a TODO.

**Copy is honest throughout** and worth mining when the screen gets built — every number
came out of `player_data.csv` or this document: 546 in the pool, 463 in the top five,
Haaland's real 140M opening bid, the +1/+5/+10 bid steps, the 2–5 cap, the 15s default.
Several frames also put per-position counts and the CM shortage on screen; **that part
did not survive the port** and shouldn't be mined — see Copy below.

**Status: resolved.** Layout **04 · Ready room** (Split Studio) is what gets built.

**What 04 is:** a hard 50/50 diptych — *who is playing* on the left, *what they're
playing* on the right — divided by a surface step rather than a rule (left half sits on
`--color-surface`, right half on the ground).

- **Left:** "Your table", `4 / 5 SEATS`, then five ruled rows — you (an accent disc, host,
  labelled as the one who sets everything on the right), three bots as outlined rings
  numbered 1–3 each captioned "Default style — bots don't have personalities", and a fifth
  dashed row "Add a bot · One seat left. Nothing fills it for you." Rendering the empty
  seat is what makes the 2–5 cap and the no-auto-fill rule legible without prose. Bots get
  abstract rings, never player faces — a face would imply a bot *is* somebody.
- **Right:** four labelled chip groups — Format, Scope, Constraint, Bid timer — over a
  stadium plate cornered into the bottom-right at ~42%. Constraint's four chips are
  present, dashed and dimmed, under "Free Pick only. Auction doesn't take a constraint."
- **Bottom:** back-to-home as a quiet label, `Kick off →` as the accent button.

### The single-player lobby (built)

`src/routes/SoloLobby.tsx` plus four components in `src/components/lobby/`. What shipped
follows the frame's composition and departs from it where a live screen has to:

- **Format is carried on the URL**, seeded from whichever home tile was clicked. Landing
  on a bare `/solo` leaves **every format unpicked** rather than defaulting to one — the
  four formats are equals and none of them is the house default. `Kick off` is disabled
  until one is chosen and the status line says why. The route component is keyed on the
  format id so arriving at a *different* one rebuilds the screen instead of reusing the
  instance and keeping stale state.
- **The Constraint group collapses** when the format isn't Free Pick, rather than sitting
  there dimmed. Reserving its space and fading it leaves a group-sized hole that reads as
  breakage; each group therefore carries its own top spacing *inside* a collapsing
  wrapper, so the gap goes with the group. Same mechanism for the scope's sub-row.
- **Scope narrows in place.** "One league" reveals the five league crests, "One nation" a
  select of every nation in the pool. Crests are unfiltered and full colour, with a 1px
  ink stroke drawn *around* the artwork (`.crest`) — two of the five marks are dark and
  would otherwise vanish into the ground, and the alternative (a light plate behind each)
  is five bright tiles on a screen with no other bright surface.
- **The timer is "Turn timer", not "Bid timer".** It applies to every format; naming it
  after bidding privileges Auction.
- **Motion is the quiet register** — `fd-soft`, a fade with 7px of travel, staggered
  across the two halves; the plate keeps drifting on the shared 30s loop; every state
  change is a colour transition or a collapse. No wipes, no choreography.
- **Two seat renderings.** Ruled rows from `md` up; below it the seats compress to a strip
  of discs with `+` / `−` on the end, because the rows and their captions cannot fit a
  short viewport that also has to hold four settings groups.
- **Vertical rhythm is a height query, not a clamp.** `clamp()` against `vh` never reaches
  its minimum at 568px tall — the middle term is still inside the range — so the lobby's
  spacing tokens (`--lobby-gap`, `--lobby-pad-y`, `--lobby-chip-py`, `--lobby-chip-mt`,
  `--lobby-crest`) collapse under `@media (max-height: 720px)`. Verified with the tallest
  possible state (Free Pick + One league) at 320×568, 768×568 and 1280×700.

**Kicking off is an honest dead end** — the draft screen doesn't exist, so the status line
says so. That line does double duty: it carries the disabled control's reason too.

### The multiplayer lobby (built)

`src/routes/MultiLobby.tsx` at `/lobby/:code`, plus `NameGate`, `RoomCode` and
`LobbyChat` in `src/components/lobby/`, `src/data/lobbyPeople.ts`, and two small modules
in `src/lib/` (`roomCode.ts`, `lobbySession.ts`). `SeatList` was generalised from
"you plus bots" to a list of typed `Seat`s — you, humans, bots — and both lobbies now
render off it. `ChipGroup` and `ScopeDetail` gained a `readOnly` mode.

No exhibition: it is the same **Split Studio** diptych as the single-player lobby, at
different knob values. What a room full of people needs that a room full of bots doesn't:

- **The name gate.** Creating a lobby and joining one both stop at the same modal
  `<dialog>` — one field, the room code shown alongside it. A real `<dialog>` so the page
  behind it goes inert, focus is trapped and Escape closes it without any of that being
  hand-rolled; there's a non-modal fallback for engines without `showModal`. The field
  opens pre-filled from the last name used. The gate is rendered from **two places** —
  over the home page for create/join, and over the lobby itself for a pasted invite link,
  which is what makes `/#/lobby/KX7QD` work as an address rather than only as a
  destination.
- **The room code is the display type**, where the single-player lobby had "Your table".
  It's the thing being read out over a call, so it gets the size and the tracking, with a
  **Copy link** control that writes the full invite URL to the clipboard and reports back
  in its own label rather than in a toast. Below `md` the block collapses onto one row —
  the four settings groups and five seats have to land above the fold at 320×568, and
  this is where the room comes from.
- **Host and guest are different screens.** Only the host sets Format, Scope, Constraint
  and Turn timer *(R5-Q4)*, so a guest gets the same four groups drawn as static chips
  with the host's choices already on them, `Only <host> can change the draft or start it`
  in the status line, and `Waiting for the host` where `Kick off` would be. Whose lobby
  it is rides in on router state and is kept in `sessionStorage` per code, so a refresh
  doesn't quietly demote the host.
- **The room is simulated**, per the fake-functionality rule. People arrive on a stagger
  (2.6s / 7.8s / 15.4s), take real seats, stop when the table is full, and say something
  a beat after they sit down. A code you were *handed* already has a host and a draft
  behind it — settings are derived from a hash of the code, so the same code always opens
  the same lobby.
- **Chat**, in the space the single-player lobby left empty under the table. It sends,
  and what you send is drawn in the accent against everyone else's ink. It is the one
  scrolling region in the app — the page never scrolls, but a conversation has to go
  somewhere — and it's the first thing to go under `@media (max-height: 720px)`.
- **Seats start empty.** The friends lobby opens with just you: `1 / 5`, `Kick off`
  disabled, and `Two at the table to start — invite someone, or add a bot.` Bots are
  still added by hand and only by the host *(R5-Q5)*. `minSeats` is 1 here rather than 2,
  so a bot added early can be removed again when a human turns up; the 2-drafter minimum
  is enforced at kick-off instead.

Verified in a browser at 1280×800, 1280×700, 768×568 and 320×568, host and guest, in the
tallest possible state (Free Pick + One league, five seats). No scroll anywhere, no
horizontal overflow, footer always above the fold.

### Both lobbies: viability gating (2026-08-18)

Both settings panels are now gated by what the table can actually seat — see Draft
Viability below for the measurement behind it. Shared between the two screens:

- `ChipGroup` takes `isUnavailable` / `unavailableHint`; an unavailable chip is dashed,
  faint, `disabled`, and carries the seat count in its accessible name.
- `ScopeDetail` does the same for the league crests. **Unavailability is drawn on the
  chip *and* as a whole-control opacity** — the crest is dimmed with its chip rather
  than treated on its own, so nothing is greyed, filtered or silhouetted and the badge
  keeps every colour it has. A dashed hairline alone was tested and was far too quiet
  at that size to read as "not on offer".
- The seat count drives everything live, so a bot added or a person arriving
  re-evaluates the panel. A selection that becomes unplayable keeps its accent but goes
  dashed rather than snapping to something valid, and `Kick off` disables while it
  stands.
- The nation `<select>` is gone with the nationality Scope.

**Gotcha worth not rediscovering:** the crest images need `min-h-0 min-w-0`. A grid
item's automatic minimum size (`min-height: auto`) is content-based and, for a replaced
element, clamps the height back *up* past an explicit `h-[64%]` using the image's
intrinsic aspect ratio. Landscape and square marks are width-constrained so it never
bites; the two portrait lockups (Serie A, Ligue 1) grew past the chip and clipped along
its bottom edge. `mockups/crest-chip.html` reproduces it before/after at 6× with a
measured readout, and `mockups/logo-centre.html` is the throwaway that ruled out the
artwork itself being off-centre.

## Configuration Mechanics

Every draft is configured along three independent axes: **Format**, **Scope**, and
**Constraints**.

### Formats

#### Auction
3 example players: John, Paul, Ringo. Each starts with a budget (e.g. 1B euros). A
footballer comes up starting at a predetermined starting value (not 0). Players bid in
real time; if no one bids, the footballer is gone. Highest bidder wins. If the buyer has
an open slot for that footballer's position, it fills the slot directly. If every slot
for that position is already occupied, the purchase **overflows into the buyer's
graveyard** instead — a holding area for purchased-but-unplaced footballers that only
becomes relevant, and visible, once a buyer has an overflow purchase sitting in it. From
there the buyer can swap it into that slot in place of whoever currently holds it,
whenever they like. *(R7.2-Q1, overturning the graveyard-always framing settled in
R7-Q5 — Mert changed his mind one round later)* It's a straight two-way swap: the
footballer bumped out of the slot goes into the graveyard in turn. *(R7.3-Q2)* Since
positions are a hard gate *(R7.3-Q1)*, "rearrange their formation" now means exactly
this — swapping the graveyard against a slot — not moving a footballer to a slot
they're not listed for.

The graveyard lets a player upgrade their lineup or block opponents from getting certain
footballers, and is **unlimited** — no cap on how many footballers can sit in it, no
extra cost beyond the winning bid. *(R1-Q7)* Bidding is **not gated by slot status** — a
player with an already-full XI can keep bidding for graveyard overflow or purely to
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
in the lobby ends up with. *(R6-Q3)*

Since the position reform made positions a **hard gate** — a footballer only ever fills
their one listed slot, no exceptions *(R7.3-Q1)* — the same filtering mechanism also
removes any footballer whose designated slot is already full in the picker's own XI.
There's no graveyard here to catch an overflow pick the way Auction does, so it's simply
not offered. *(R7.3-Q3)* Whether the combination of that filter and the Constraint
filter could ever leave a player with zero legal options for a position they still need
is believed unlikely to happen in practice (given the pool's guaranteed position
coverage) — reconsidered after the position reform removed the flexibility that
judgment originally leaned on, and reconfirmed unchanged: still no explicit fallback
rule defined for that edge case. *(R6-Q4, revisited and held at R7.3-Q4)*

#### Spin the Wheel
The wheel is **never mixed** — no single wheel has club slices next to league slices
next to nationality slices. Every spin's wheel is entirely one category: all clubs, all
leagues, or all nationalities. *(R4-Q6, overturning the mixed-wheel reading of R3-Q3)*
Whichever single category is in play, the pick itself is a free pick in a snake draft —
including Free Pick's slot-full filtering above, since it's the same underlying pick.
*(R7.3-Q3)*

Which one category applies is still governed by Scope — whichever of **league / club /
nationality** the current Scope *hasn't already fixed* is eligible to be the wheel's
category: Scope = All players or Top 5 Leagues leaves all three eligible; one specific
league fixes league, leaving clubs or nationalities as options. *(R3-Q3)* That category
is picked **once, at the very start of the draft** — the whole draft uses that one
category type throughout, it doesn't change between spins. *(R5-Q1)*

R3-Q3's fourth case — "one specific nationality fixes nationality, leaving leagues or
clubs" — is **moot since the nationality Scope was withdrawn** (see Scope below). No
Scope now fixes nationality, so the wheel's category is only ever narrowed by the
single-league Scope.

The wheel is spun before every pick. If the wheel lands on a category with no eligible
footballers left, that turn **falls back to a free pick from the full remaining pool**
— just for that turn, the wheel category isn't removed and play resumes normally next
turn. *(R2-Q4)*

**No graveyard**, same as Free Pick — it's a picking format, not a bidding one. *(R3-Q2)*
First pick order is a **random draw**, same as Free Pick. *(R2-Q6)* **No Constraints**
support — that's Free Pick only. *(R5-Q2)*

### Scope
~~Four values: **All players**, **Top 5 leagues**, **one specific league**, **one
specific nationality**.~~

**Three values as of 2026-08-18: All players, Top 5 leagues, one specific league.**
One specific nationality was **withdrawn** — see Draft Viability below. Simulating
every configuration against the real pool showed no nationality can seat three
drafters and only one (Spain) can seat two, so it was cut rather than shipped
permanently dimmed: a scope that fails at every table size worth offering is a dead
end, not a narrowing. The per-nationality **constraints** are a different setting and
are unaffected.

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
bidding in the first place. Backfill targets empty slots by definition, so it always
places directly into the 11 — it can't overflow into the graveyard the way a live
purchase can. *(R7.2-Q1)*

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
~~Once a draft ends, the roster is locked but players can still rearrange which
already-drafted footballer sits in which formation slot.~~ **Narrowed 2026-08-18**: with
positions a hard gate, no footballer can ever occupy a slot other than the one they're
listed for, so there's nothing left to rearrange between slots. What survives is
**graveyard swapping** — a player can keep swapping their own graveyard footballers
against their XI after the draft ends, the same bump-swap mechanic as during Auction
(above), just no longer time-limited by the draft being live. *(R1-Q10, narrowed by
R7.3-Q5)* Free Pick, Spin the Wheel and Deal or No Deal have no graveyard, so it's
unclear yet whether anything analogous to Post-Draft Editing exists for them at all —
open, see Position Reform below.

### Multi-Position Eligibility — retired

~~A footballer listed with several eligible positions (e.g. "AMF, RW, LW") still only
fills one slot, and only counts as one pick — but which of their listed positions they
occupy is freely reassignable afterward.~~ **Retired 2026-08-18** by the Position Reform
below (R7-Q4) — every player in `player_data.csv` now carries exactly one position, so
there's nothing left to reassign among. Kept here, struck, as a record of what used to
be true. *(R3-Q8, superseded)*

### Position Reform (Round 7 — data complete, rule fallout still being worked out)

`player_data.csv`'s Position column was rebuilt from multi-position tags to one
canonical position per player, decided across three questionnaire rounds on 2026-08-18.
All 546 players were replaced in a single delivery — the "however many batches it takes"
possibility from R7-Q2 never materialized; Mert handed over the full pool at once as
`player_single_position.csv` (`Name,Nation,Position`; ten formation-slot labels only,
validated against the live data with zero invalid values). The original multi-position
file is preserved at `player_data_multiposition_backup.csv`.

Settled, Round 1 (R7):
- **Destructive replacement** — the single listed position is now each player's only
  Position value; no multi-tag data survives alongside it. *(R7-Q1)*
- **Full remap was the goal and is what happened** — all 546 players got a canonical
  position in this one delivery. *(R7-Q2)*
- **Multi-Position Eligibility is retired outright** — see above. *(R7-Q4)*
- Whether the reform specifically targeted the CM depth gap **was never answered** —
  moot now the data's in: CM went from 10 to 93 either way. *(R7-Q3, declined)*

Settled, Round 2 (R7.2) — the first bullet **supersedes R7-Q5**, decided one round
earlier, which Mert reversed:
- **Auction purchases go straight into an open slot by default.** A purchase only lands
  in the graveyard if every slot for that position is already full — the graveyard is a
  holding area for overflow, not the universal landing zone R7-Q5 first described. From
  the graveyard, the buyer can swap a footballer into that slot in place of whoever's
  holding it, whenever they like. *(R7.2-Q1)*
- **The end-of-auction backfill (Squad Completion Guarantee) always places directly** —
  it only ever targets empty slots, so it can never overflow. *(R7.2-Q1)*
- **The graveyard-overflow rule stays Auction-specific** — Free Pick and Spin the Wheel
  keep placing straight into a slot, no graveyard. *(R7.2-Q2)*
- Whether the overflow rule was already live independent of the remap **went
  unanswered** — moot now that every player has one position; there's no "unmapped"
  state left for it to be conditional on. *(R7.2-Q3, unanswered, moot)*
- Incoming positions matched the ten formation slots exactly, as promised — no
  out-of-formation tags (LM/RM/LWB/RWB/CF) needed mapping. *(R7.2-Q4, confirmed against
  the actual data)*
- The "player nobody sends a position for" fallback (keep their multi-position tag
  permanently) was **decided but never triggered** — every player arrived in this one
  batch. *(R7.2-Q5)*
- Scope/CM-table recomputation: Mert didn't care either way, so it was just done — see
  the rebuilt table in Player Data below. *(R7.2-Q6)*

Settled, Round 3 (R7.3) — what the reform actually does to placement, now that the data
is in:
- **Positions are a hard gate.** A footballer only ever fills the one slot they're
  listed for — in any format, at draft time or after. Not a default a human can
  override. *(R7.3-Q1)*
- **Auction's graveyard swap is a straight two-way swap** — the footballer bumped out of
  a slot goes into the graveyard, same as the one that displaced them once did. Folded
  into the Auction rules above. *(R7.3-Q2)*
- **Free Pick / Spin the Wheel filter out a footballer whose slot is already full**, the
  same mechanism as the Constraint filter — there's no graveyard to catch it as an
  overflow the way Auction does. *(R7.3-Q3)*
- **Open Question #21 (constraint deadlock) was revisited and held** — the "unlikely in
  practice" judgment survives the reform unchanged; still no fallback defined. *(R7.3-Q4)*
- **Post-Draft Editing narrows to graveyard swapping** — rearranging which footballer
  sits in which slot is impossible under a hard gate, so what survives is continuing to
  swap graveyard footballers against the XI after the draft ends. Whether Free Pick,
  Spin the Wheel or Deal or No Deal — none of which have a graveyard — get any
  equivalent is **open**, carried to the next round. *(R7.3-Q5)*

## Player Data

`player_data.csv` is the footballer pool: name, nation, age, club, position(s), current
ability, league, plus derived **Derived Price (EURm)** and **Opening Bid (EURm)**
columns (see Player Data Pool above for how those are computed). Covers the top 5
leagues (Premier Division, Serie A, First Division, Bundesliga, Ligue 1) plus a number
of high-ability players from other leagues (Saudi Pro League, MLS, Eredivisie, Sky Bet
Championship, etc.).

**CM depth gap: resolved by the position reform.** Under the old multi-position tags,
only 10 footballers listed CM as one of several eligible positions — a data hole that
made three of the five single-league Scopes unseatable outright. The 2026-08-18 full
remap to single positions (see Position Reform above) folded a lot of previously
CDM/AMF-tagged players into CM, taking the pool-wide count from 10 to **93**. Full
per-position counts now: CB 100, CM 93, ST 75, RW 48, LW 44, AMF 39, GK 39, RB 37,
CDM 36, LB 35 (546 total). **The UI still does not surface any of this** — pool counts,
per-position depth and Scope availability stay off screen regardless of how healthy the
data is, per the standing no-internal-data-on-screen rule.

The Scope max-drafter ceiling below used to be governed by CM everywhere; it no longer
is. Recomputed per league across all ten slots (CB needs two per drafter, so its cap is
`floor(count / 2)`):

| League (CSV name) | Players | Bottleneck slot | Max drafters |
|---|---|---|---|
| Premier Division | 167 | LB (7) | 7 |
| Serie A | 110 | LW (5) | 5 |
| First Division (La Liga) | 104 | CDM (3) | 3 |
| Bundesliga | 50 | GK (2) | 2 |
| Ligue 1 Uber Eats | 32 | CB (3 → 1 pair) | **unusable** — below the 2-drafter minimum |

**Four of the five single-league Scopes can now seat a draft** — and Premier Division's
and Serie A's ceilings sit above the game's own 2–5 lobby cap anyway, so neither is
actually binding. Only **Ligue 1 Uber Eats stays unusable**: CB, its scarcest slot,
clears just one drafter's worth. *(Recomputed here since the reform made the old table
false; not something Mert asked for by name — R7.2-Q6 came back "I don't know and I
don't care," read here as license to just fix it rather than open another round.)*

Nationality Scope's headcount problem is untouched by the reform — position tags don't
change how many players carry a given nationality: still only 10 nations reach 11+
players (Spain 73, England 61, France 45, Italy 43, Brazil 37, Germany 32, Portugal 26,
Argentina 25, Netherlands 25, Uruguay 11), so most nationalities can't fill even one XI,
and no club reaches 11 either (Arsenal tops out at 20, but a single club was never a
Scope option). **That per-position pass has since been done — see Draft Viability
below, and it was much worse than the headcounts suggested.**

## Draft Viability

**Not every configuration can actually be played.** Established 2026-08-18, after the
position reform, by simulating every configuration against the real pool rather than
reasoning about it. Both lobbies now offer only what the table in front of them can
seat.

### Why it needed measuring

Headcount was never the real constraint, and the old per-league table in Player Data
above was wrong about which position binds. Two things decide whether a draft can
finish:

1. **Supply at the scarcest position.** With every footballer now filling exactly one
   slot, a Scope needs `lobbySize` players at each of the ten slots (two per drafter at
   CB). The binding slot differs per Scope and is rarely the one you'd guess.
2. **Constraint deadlock.** Under Free Pick a per-squad constraint can strand a drafter
   partway through — their own earlier picks leave them with no legal footballer for a
   slot they still need, even while the pool still holds players at that position.
   This is Open Question #21, and it is **not** the theoretical edge case R6-Q4 and
   R7.3-Q4 both judged it to be.

### The simulation

`scripts/simulate_draft_configs.mjs` runs every configuration in
`draft_config_permutations.csv` (2,176 rows: 4 formats × 68 scopes × constraints ×
lobby sizes 2–5) against `player_data.csv`, up to 50,000 simulated drafts each,
flagging and skipping a configuration the moment one run hits a shortage. Results land
in `draft_config_simulation_results.csv`.

The script's header comments record exactly what each format models and — more
importantly — what it deliberately doesn't invent: Auction has no bidding strategy
(bot decision logic is still deferred), so it's a neutral direct-to-slot baseline and
comes out fully deterministic; Spin the Wheel is modelled as an unrestricted free pick,
which its dry-category fallback makes a fair, slightly conservative proxy; Deal or No
Deal doesn't model the AI proposer's offered player, because its resourcing isn't
specced. **Don't read those parts as rules** — they're stand-ins chosen so the
simulation doesn't fabricate mechanics.

Run depth mattered: 500 runs proved deadlocks exist, 5,000 caught two more
configurations that 500 had missed. **5,000 is the authoritative pass**; the 500-run
results are kept alongside as `draft_config_simulation_results_500.csv` for comparison.

### What it found

- **114 of 2,176 configurations survive** (5.2%).
- **Viability is strictly monotonic in lobby size** — a configuration that fails at N
  fails at every size above N. Verified at generation time, and it's what lets the
  shipped data compress to one number per configuration.
- **Constraint deadlocks are real.** Several configurations pass 500/500 with no
  constraint but fail with one — and fail dozens of runs in, not on the first, which is
  what distinguishes a genuine deadlock from plain insufficient supply (e.g. First
  Division · 3 per club · 2 drafters failed on run 96; Premier Division · 1 per club ·
  2 drafters on run 47). Open Question #21 should be considered **demonstrated, not
  hypothetical**.
- **Nationality Scope is unusable** — no nationality seats three drafters; only Spain
  seats two. This is what got the Scope withdrawn.
- **Four of five single-league Scopes fail at five drafters.** Only Premier Division
  and Serie A hold at a full table.
- **All four formats survive at every lobby size**, so the no-house-favourite rule is
  never broken by availability.

### What ships

`scripts/generate_viability_data.mjs` turns the results CSV into
`src/data/draftViability.ts` — one number per `format|scope|constraint` triple: the
largest table it still completes at, absent meaning never. It drops the nationality
rows (unreachable now the Scope is gone) and re-verifies monotonicity, throwing if it
ever breaks. 34 entries.

`src/lib/draftViability.ts` is the lookup the lobbies use. Regenerate with
`node scripts/generate_viability_data.mjs` after any re-run of the simulation, and note
that **`player_data.csv` changing invalidates all of it** — the whole chain has to be
re-run.

Two things the data deliberately does not cover: **Free Pick with no constraint at
all** is simulated (and is more permissive than any of the four constraints — it's the
only thing that makes Serie A work at five) but the lobby has no chip for it, so
availability maths ignores it rather than advertising room a host can't reach. And
lobby sizes below two aren't modelled, so the lobby judges a one-seat table as if it
were two.

### On screen

The rule from Copy still holds: **none of the above reaches the user.** No pool counts,
no per-position depth, no talk of simulations. A configuration the table can't seat is
drawn dashed and faint and can't be selected; the status line names the one setting
that doesn't fit ("1 per club doesn't support four at the table") or, failing that,
says dimmed options don't support this many. That's the whole vocabulary — how many
seats an option supports, never why.

Everything re-reads live off the seat count, so adding a bot or somebody arriving in
the friends lobby re-evaluates the panel. A selection that *becomes* unplayable keeps
its accent but goes dashed rather than silently snapping to something valid, and
`Kick off` is disabled while it stands.

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
21. **Free Pick constraint deadlock — OPEN, and no longer hypothetical.** A drafter's
    own earlier picks can leave them with zero legal options for a slot they still
    need. Judged "unlikely in practice" twice (R6-Q4, and again at R7.3-Q4 after the
    position reform), both times without measuring it. The viability simulation
    (Draft Viability above) then **demonstrated it**: configurations that pass 500/500
    unconstrained fail with a constraint, dozens of runs in.
    The lobby currently sidesteps this by refusing to offer the configurations where it
    was observed, which is containment, not a rule — **there is still no defined
    in-draft fallback for a deadlock that happens anyway**, and the simulation only
    covers the configurations the lobby offers. Worth a decision: auto-waive the
    constraint for one pick, pause for the host, or something else.
~~22. Host transfer on disconnect~~ Resolved R6-Q6: auto-passes to next-earliest joiner.
~~23. Indefinite blocking bids in Auction~~ Resolved R6-Q7: intended, no cap.
~~24. AI proposer offer targeting~~ Resolved R6-Q8: flat/position-based, not per-player.
~~25. Squad-share export timing~~ Resolved R6-Q9: manually triggered.
~~26. Lobby carryover between back-to-back drafts~~ Resolved R6-Q10: nothing carries
    over, clean slate every time.
27. Position Reform (R7): data applied 2026-08-18, destructive full remap to one
    position per player in a single delivery (R7-Q1/Q2); Multi-Position Eligibility
    retired (R7-Q4); Auction purchases direct-to-slot by default, graveyard only on
    overflow as a straight two-way swap, Auction-specific, backfill always direct
    (R7.2-Q1/Q2, R7.3-Q2, superseding R7-Q5); positions are a hard gate (R7.3-Q1); Free
    Pick/Spin the Wheel filter a full-slot footballer out of selection (R7.3-Q3);
    constraint-deadlock judgment reconfirmed (R6-Q4, R7.3-Q4); Post-Draft Editing
    narrowed to graveyard swapping (R1-Q10, R7.3-Q5). CM-targeting (R7-Q3) and pre-remap
    timing (R7.2-Q3) were never answered but are moot now the pool is fully remapped.
    **Still open:** whether Free Pick, Spin the Wheel, or Deal or No Deal — none of which
    have a graveyard — get any post-draft equivalent.

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
| 7 | Position reform: full remap to single positions, Multi-Position Eligibility retirement, Auction overflow-to-graveyard mechanic, hard-gate placement, Post-Draft Editing narrowed | In progress (3 rounds; Free Pick/Spin the Wheel/D-o-N-D post-draft equivalent still open) |
| 8 | TBD | Not started |
| 9 | TBD | Not started |
| 10 | TBD | Not started |
