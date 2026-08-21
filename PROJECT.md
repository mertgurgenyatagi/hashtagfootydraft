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

Round 8 (Bot Questionnaire 1) ran 2026-08-18 on the **`bot-questionnaires`** branch:
settled Auction starting budget formula, auction bid timer resets, unsold player handling,
Deal or No Deal banker sourcing/box handling, Free Pick deadlock stance, non-auction post-draft
permanence, and defined the formal position-weighted squad evaluation metric for ML bot training.

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

The **`auction-training`** branch, cut from `main` on 2026-08-19, opened the from-scratch
build of the Auction bot's RL training pipeline — the one format the 2026-08-18 training
run never completed. Before any training design was written, forensics on the wiped
auction environment turned up a **rule gap rather than a tuning bug**: nothing bounded how
many footballers went on the block, so an All Players draft auctioned all 546 of them.
That produced the **Auction lot cap** settled below — at most **15 × lobby size**
footballers per auction. It is a game rule, not a training shortcut: it governs the
auction humans play, and the training environment inherits it.

The **Free Pick draft screen**, built 2026-08-19 on `free-pick-ui-static`, went through a
simplification pass on 2026-08-20 on the same branch: the wordmark bar and the rail's
section-numeral pattern were dropped, the clock lost its seconds and pick count, pool rows
and the pitch grew, and the face-anchoring system behind the portrait panel was rebuilt from
scratch to hit a fixed face position without pre-cropping any image. `HANDOVER.md`, the
working document that pass was tuning against, was removed once it was done — see The Free
Pick draft screen below for the full record.

The **`resolution-generalization`** branch, cut from `main` on 2026-08-20, replaced the app
frame's single asymmetric bottom inset with two symmetric tokens — `--app-inset-x`
(left = right) and `--app-inset-y` (top = bottom) — shared by all four routes, and turned a
handful of component sizes that used to jump at one remembered breakpoint into continuous
`clamp()` scaling instead; see **The app frame, symmetric** below. The same branch then ran a
full workspace audit against all 975 tracked files plus everything untracked and gitignored
on disk (published as an artifact, "Preseason Cuts") and acted on the 25 decisions that came
back: removed the `public/assets` symlink that had been shipping the 593 MB raw photo archive
into `dist/` on every build, fixed four silently-broken `.gitignore` patterns, corrected this
document's stale claims about Auction bot training (see the 2026-08-20 update under **Project
Handover** below) and about `player_data_ability_backup.csv`, and cleared assorted stray files
— the root `checkpoints/`, two throwaway mockups, the HTML duplicates of the bot
questionnaires, and other litter. That branch was committed, pushed and merged to `main` on
2026-08-20. All work described below is now on `main`.

The **`size-tweaks`** branch, cut from `main` on 2026-08-20, ran a fast Tachyon-mode pass over
both draft screens: page transitions and a back-to-home link on Free Pick, face-anchored
photos in pitch nodes (both screens, on preview as well as on confirmation), and a restructure
of the Spin the Wheel orbit — the portrait moved inside the pool panel at a 65/35 split, chat
and the turn indicator swapped columns, the pool and chat now split 66/33 by height, and the
pool's `Draft →` button shrank by half. See **Spin the Wheel: this pass** below for the full
record. That branch was committed, pushed and merged to `main` on 2026-08-20. All work
described below is now on `main`.

The **`dond-ui`** branch, cut from `main` on 2026-08-20 after the Deal or No Deal exhibition
(`pre-dond-ex-q`) had already merged, built the Deal or No Deal draft screen — the third of
the four formats to get one, off the exhibition's picked layout 18 · Sections. A Tachyon-mode
pass: no brainstorming phase, sensible defaults chosen and stated rather than asked. See **The
Deal or No Deal draft screen** below for the full record. That branch was committed, pushed
and merged to `main` on 2026-08-20. All work described below is now on `main`.

The **`auction-draft-ui`** branch, cut on 2026-08-21, opened the last of the four draft screens
with a **12-layout exhibition** (`mockups/auction.html`), built against twelve non-negotiables
Mert set before any layout was drawn — see **The Auction draft screen exhibition** below. Two of
those constraints are stated as **site-wide changes that start here**: player photographs and club
crests now carry their own colour with no filter at all, and the stadium plate runs far louder
than the earlier screens set it. A third — that **auction bidding is real time, not turn-based** —
is a game-rule clarification and is recorded under Auction below. **Layout 01 · The block** was
picked off that exhibition and **built the same day**, with the sold record swapped to layout 09's
square photographs; both site-wide changes went in with it, on the Auction route only. That
completes the front end — all four formats now have a screen. A Tachyon-mode pass throughout: no
brainstorming phase, no plan phase, defaults chosen and stated afterward rather than asked
mid-build.

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
| `--color-tint` | `#123030` | the `mix-blend-mode: color` wash over the stadium backdrop |

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
- **Photographs of footballers and club crests are exempt from all of it.** They render in their
  own colour, unfiltered — no grayscale, no tint wash, no blend mode. *(Set by Mert 2026-08-21 on
  the `auction-draft-ui` exhibition; site-wide in intent, not yet applied to `src/`.)* The tint is
  the backdrop's treatment only. The one-saturated-accent rule still governs everything the app
  draws itself.
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
draw a ring (a bordered circle) in the same footprint instead.**

**Do not scope a draft by the CSV's `League` column.** It names the competition a row was
scraped from, not the division the club plays in, so it files Fenerbahçe's players under
"Serie A" and Flamengo's under "First Division", and 19 rows carry `-`. Scope by the
**club** instead: `src/data/clubs.ts` maps all 69 crested club slugs to a `LeagueId`, and
is the authority. It falls out of the crest set for free — a club the app cannot draw is
a club it should not offer — and it is generated, so regenerate rather than hand-edit.

`scripts/process_club_logos.py` is what produced them — it imports from an external
Wikipedia-sourced logo dump (kept outside the repo, like the other raw source art),
maps CSV club names to Wikipedia article filenames through a hand-built table, and
compresses in two stages: downsample any embedded raster the export wrapped, then `svgo
--multipass --precision=1`. Clubs that aren't in the top-five-league rows are left on the
placeholder deliberately, which also absorbs CSV noise (River Plate filed under "Premier
Division").

Player photos are real, for 545 of the 546 players in `player_data.csv`, at
`public/players/{slug}.webp`, keyed by `slugify(name)` from `src/lib/players.ts`. That
slug has to fold the letters `NFKD` will not decompose — ø, ß, ð, đ, ł, æ, œ, þ, ı are
letters in their own right rather than an ASCII letter wearing a mark, and without the
table Ødegaard, Groß, Guðmundsson, Nørgaard, Sørloth and Højlund all miss their photo.
Anything still missing falls through to the club crest at the point of use. The one gap is
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

**`src/data/faceAnchors.ts` is the second consumer**, generated from the same file: the
centre of each face box as a percentage of the image, fed straight to `object-position`
so a crop of any shape lands on the face. The draft screen's portrait panel uses it. It
is 545 entries and ~12 KB in the bundle, which beat a second network fetch for a file the
screen needs on first paint.

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

**The home page, both lobbies and all four draft screens — Free Pick, Spin the Wheel,
Deal or No Deal and Auction.** `App.tsx` is a
`HashRouter` over `/`, `/solo/:formatId` (plus a bare `/solo`), `/lobby/:code` and
`/draft/:formatId`, with a catch-all back to home. The hash is not a preference: GitHub Pages serves static files
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

**Kicking off goes to the draft.** Both lobbies now navigate to `/draft/:formatId`, handing
the scope, league, constraint, timer and the seat list over as router state — so the draft
opens on the table that was actually sitting in the lobby rather than on a default one. The
status line kept its other job: it carries the disabled control's reason.

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

### The Free Pick draft screen exhibition (2026-08-19, `free-pick-ui-static`)

**Where:** `mockups/free-pick.html`. Same self-contained gallery shell as the other three — 1280×800
frames at half scale, click one to zoom to full width, opens straight off disk, no build step and no
server.

**Twenty layouts**, one per Hallmark macrostructure; Feature Stack excluded again (needs scroll).
Same two rules as the lobby run: **palette fixed to petrol**, no switcher, and **type held to Oswald
+ Inter** with Bebas Neue only on the wordmark, so every difference between frames is structural and
whatever gets picked ports without a type swap. **No motion at all** — first look only, by explicit
instruction.

01 The list · Index-First — 02 Two halves · Split Studio — 03 The board · Bento Grid — 04 The pitch ·
Map/Diagram — 05 The card index · Catalogue — 06 The console · Workbench — 07 Nine · Stat-Led —
08 Four ways in · Ecosystem Index — 09 Seven open · Component Playground — 10 The call · Marquee Hero
— 11 Eleven rounds · Narrative Workflow — 12 What do you need · Conversational FAQ — 13 Four squads ·
Portfolio Grid — 14 The names · Type Specimen — 15 Matchday · Photographic — 16 One per club ·
Manifesto — 17 The team sheet · Long Document — **18 Sections · Specimen** — 19 The room · Quote-Led
— 20 Dispatch · Letter.

**All twenty are drawn in one internally consistent draft state**, so the frames are comparable:
Free Pick · Top 5 leagues · 1 per club · 4 drafters · round 5 of 11 · pick 18 of 44 · your turn · 9s.
Your four picks (Haaland, van Dijk, Bellingham, Kimmich) spend Manchester City, Liverpool, Real
Madrid and Bayern Munich, which knocks Valverde, Foden, Rüdiger and Alexander-Arnold off *your*
board while leaving them on everyone else's — the per-squad constraint made legible without prose.
Every player, club, nation, age and crest is a real row of `player_data.csv`; the configuration was
checked against `src/data/draftViability.ts` (`free-pick|top-5|club-1` seats 5).

**Four decisions the run settled, all confirmed by Mert on 2026-08-19, all project-wide:**

- **No ability ratings and no pool counts on a draft screen.** Both are data-model facts and the
  standing no-internal-data rule already keeps them off. Free Pick also has no currency — so **the
  only numerals on a Free Pick screen are the clock, the round and the pick number.** Auction is the
  numbers format; Free Pick is the names format.
- **The pool is ordered alphabetically.** There is no "best available" ordering: sorting by ability
  leaks the same fact that hiding the rating was meant to keep off screen, so the number and the
  ranking go together. The position filter is what narrows the list. *(The exhibition frames were
  drawn before this and still list descending by ability — superseded.)*
- **An unavailable player row is dimmed whole, crest included** — the same treatment the lobbies use
  for unavailable chips, and the only one that respects the never-recolour-a-crest rule.
- **"Filtered out" means unselectable, not invisible.** An illegal footballer — wrong slot, or
  blocked by the constraint — stays in the list, dimmed and struck through, captioned with the club
  that spent them. This is how R5-Q9 and R7.3-Q3 get drawn: seeing the best players left crossed out
  is what makes a per-squad constraint legible, where removing them silently would only make the
  pool look thinner for no stated reason.

**Status: resolved.** Layout **18 · Sections** (Specimen) is what gets built — hairline-ruled
numbered sections across three columns (`296px / 1fr / 268px`), each label stacked above its own
heading rather than hung in a margin. Two structural changes were made to it on picking, and are
**not** drawn in the frame: **the table moves into the upper bar** as a row of connected horizontal
circles with names and nothing else, and **chat moves to the bottom left**, which leaves four
sections (clock, spent, who is left, your eleven) instead of five and gives the eleven the
full right-hand column. **Built on 2026-08-19, simplified on 2026-08-20** — see the section
below, which supersedes the frame wherever they disagree and records both the first-sight
changes and the later simplification pass (the numbered-section pattern itself did not
survive it).

### The Free Pick draft screen (built, 2026-08-19; simplified, 2026-08-20)

`src/routes/Draft.tsx` at `/draft/:formatId`, eight components in `src/components/draft/`,
two libraries (`src/lib/draftEngine.ts`, pure; `src/lib/players.ts`, the pool loader) and
three data modules (`src/data/formation.ts`, and the generated `clubs.ts` and
`faceAnchors.ts`). Layout 18 as agreed, with the exhibition's two structural changes and
**five more Mert asked for on first sight of the working screen**:

1. **A portrait panel beside the pool**, showing the selected row's photograph and
   **nothing else** — no name, no badge, no caption. (Originally swapped on hover as well
   as on selection; the hover behaviour was cut in the 2026-08-20 pass below — a hero image
   that jumps under a moving pointer read as noise, and the row already carries the name a
   few centimetres to the left.)
2. **The left rail shrinks**, `296px → 224px` at build, then **`→ 270px`** in the
   2026-08-20 pass once the rail's own content simplified — see below.
3. **The eleven is a pitch, not a list.** A list of eleven rows tells you what you own; a
   pitch tells you what you have *built* — that the left of your defence is empty, that you
   are three deep in midfield with nobody to pass to.
4. **Tabs across the top of the pitch** for every drafter's board.
5. **A narrator across the top of the screen.**

**A further simplification pass ran 2026-08-20**, once the built screen had been looked at
for a while rather than just first sight of it. Mert judged it too busy and cut it back:

- **The wordmark bar is gone.** The top of the screen is the narrator and the table strip
  directly, with no `#footydraft` lockup and no quiet configuration line above them.
- **The rail lost its section numerals and its heading pattern.** `SectionHeading.tsx` (the
  numeral-above-heading pair) is deleted; the rail is three plain `SectionLabel` captions —
  **Round**, **Used**, and an unnumbered **Chat** — not four numbered sections. The pitch
  lost its "04 The elevens" heading the same way; the tabs now sit at the top of the column
  with nothing above them.
- **The clock lost its seconds and its pick count.** `DraftClock.tsx` shows only the ordinal
  round ("1st round" … "11th round") and "of 11" underneath — the countdown and
  `pick 18 of 44` were judged noise next to it. (The mobile top-bar seconds badge, shown
  below 1180px when a timer is running, is unaffected — that number still needs somewhere
  to live once the rail itself is gone.)
- **Search and the position filter stopped sharing a dividing line.** They used to sit in
  two equal halves with a shared vertical rule between them; the search field is now its own
  bordered box at roughly a quarter of the row's width, the position chips take the rest,
  and nothing draws a line between them.
- **Pool rows grew, then were pulled back in**: padding `12px → 18px → 15px`, row gap
  `11px → 14.5px`, name type `→ 16.5px`, the position tag `→ 12.75px`, the crest
  `→ 25.5px`. Net effect against the original build: noticeably taller rows and larger type,
  not the full 50% first tried.
- **The portrait panel and the pitch both grew.** Portrait width `212px → 320px` (desktop),
  `184px → 260px` (short viewport). Pitch node diameter `34px → 68px`, name plate
  `92px/9px → 184px/18px` (`144px/17px` under 1180px, unchanged).
- **The face-anchoring system was rebuilt from scratch** — see below.

#### What is on screen

Top bar: the **narrator** and the **table**, directly — no wordmark, no configuration line
— under a `--color-line-strong` rule. Then three columns — `270px / 1fr / 320–372px` —
divided by hairlines rather than surface steps.

- **The narrator** (`Narrator.tsx`) reports and nothing else: `Bot 2 took Virgil van Dijk —
  CB, Liverpool.`, held for 1.5s, then `Priya is picking.` It is **not a commentator** — no
  banter, no exclamation, no second person beyond `Your pick.` A drafter who looks away for
  ten seconds looks back at this one line and knows where the draft is. A 7px dot carries
  the state: accent when it is you, a slow opacity breath while somebody else thinks.
- **The table** (`TableStrip.tsx`) sits beside it as connected discs with names under them
  and nothing else — no pick counts, no per-seat status. Whose turn it is is the accent on
  the disc. Bots keep the lobby's outlined ring; a bot never gets a face.
- **Round** (`DraftClock.tsx`) — just the ordinal round in Oswald ("1st round" … "11th
  round") and "of 11" underneath. The countdown and the pick count used to sit here too;
  both were cut 2026-08-20 as noise next to the one number that matters on this rail. The
  seconds themselves still show, when a timer is running, as a small badge in the mobile top
  bar below 1180px — that is the one place left where the number needs to live once the
  rail is gone at that width.
- **Used** (`SpentCrests.tsx`) — your own clubs at 34% opacity (nations as text when the
  constraint counts those). No heading beyond the plain label; the constraint's one-line
  explanation that used to sit under it was dropped with the rest of the section-numeral
  furniture.
- **Chat**, anchored to the bottom of the rail. Live the entire draft, including while the
  clock is on you. The one scrolling region on the page.
- **Who is left** (`PlayerPool.tsx`) — a search field at roughly a quarter of the row's
  width, the position filter chips taking the rest with no shared dividing rule between
  them, the ruled pool, and the portrait panel beside it; then a rule, the reason line and
  the `Draft →` button.
- **The elevens** (`PitchView.tsx`) — tabs directly at the top of the column, then the
  pitch. No heading above the tabs.

#### The pitch

Drawn at real proportions — a `68 × 105` viewBox, so the centre circle is a circle and the
boxes are the size they are on a Saturday — in `--color-line-strong` hairlines. **No green:**
the ground under this app is petrol, and a strip of turf dropped into it would be the one lit
object on a dark page. Each filled slot is the club crest in a disc with the surname beneath
it on its own solid backing — a surname laid straight over the markings is a surname with a
hairline through it. Open slots are a dashed ring with the position code; the slot your
pending pick would land in is drawn in accent with the selected player's name previewed in
it, so you can see the pick land before you commit it.

The full-backs sit **higher up the pitch than the centre-backs** (`y: 71` against `y: 80`).
That is where they play, and it is also what stops the LB and CB name plates grazing each
other at 768px.

#### The portrait panel's face anchoring (rebuilt from scratch, 2026-08-20)

The portrait panel does not use a pre-cropped image — per the standing rule that player
photos stay at native resolution and aspect ratio (see Art assets above), whatever crop a
layout needs happens at that layout, not at ingest. The panel needs a face centred at
**50% across, 35% down** its own frame regardless of the source photo's own shape, without
ever cropping in past the photo's own edge and leaving a gap.

`src/data/faceAnchors.ts` is generated from `face_coordinates.json` (the same hand-marked
face boxes described under Art assets) into 545 four-value tuples, `fx, fy, ar, fh` per
player: the face box's own centre as a fraction of the source photo (`fx`, `fy`), the source
photo's aspect ratio (`ar`), and the face box's own height as a fraction of the photo's
height (`fh`). `PlayerSpotlight.tsx` reads the tuple for the selected player and passes all
four straight through as CSS custom properties; a player with a photo but no marked box
falls back to a plausible default (`0.5, 0.35, 0.8, 0.2`) rather than crashing the lookup.

`.spotlight-photo` in `index.css` does the actual placement, in two steps:

1. **Scale.** Height is `max()` of three candidates: plain `object-fit: cover` (never leaves
   a gap), a width-driven cover at the photo's own aspect ratio, and — the term that makes
   the rest of this work — `30cqh ÷ fh`, which scales the image until the *face box itself*
   reaches 30% of the panel's height. This does two jobs: it evens out how large a face reads
   across photos taken at wildly different zoom levels, and it is the only term that gives a
   landscape photo in this portrait panel any vertical slack to reposition in — a bare cover
   fit always binds on height with zero slack, since every source photo is wider than the
   panel is.
2. **Position.** `translate()` is clamped between `0px` (the photo's near edge flush with the
   panel) and `100cqw|cqh - 100%` (the photo's far edge flush with the panel) on each axis.
   Inside that range it targets whatever point puts the face at 50%/35%. A face box that is
   already large relative to its own photo — a tight crop to begin with — hits the clamp and
   lands as close to that point as the source photo allows, never with a blank strip beside
   it.

Verified in a browser at 50.0%/35.05% face-centre position across photos of very different
native crops. The previous system (a three-value `faceFrames` map feeding `object-position`
directly) could not reach 35% vertically on a landscape source, because `object-position` has
no equivalent of the `30cqh ÷ fh` scale-up term to create room to move in — replaced outright
rather than patched.

#### How far the room is exposed

**Settled here: every drafter's board is open to everyone, the whole way through.** No
reveal, no delay, no fog — that is what the tabs are. A draft where you cannot see what the
others are building is a draft whose only strategy is taking the best name left, which is
the format this app is trying not to be. Reading someone else's board costs one click and
gives nothing away, since there is nothing to give away.

#### The engine

`src/lib/draftEngine.ts` is pure and holds the rules: `seatAt` (snake — the order reverses
every round), `slotFor`, `blockedReason`, `botChoice` and `timeoutChoice`. Nothing in it
touches React, which is what makes it the thing to read when a rule is in question.

- **452 footballers** across the 69 crested clubs, parsed from `public/player_data.csv` at
  mount. Every position is at least 27 deep, so a four-seat 4-2-3-1 under `1 per club` cannot
  run out.
- **A–Z**, as decided. Ability is read by the bots and by the timeout auto-pick and is
  rendered nowhere.
- **`blockedReason` is one function** returning the sentence the row prints — `Manchester City
  is spent.`, `Your CB is filled.`, `Already drafted.` — or null. The pool row, the footer line
  and the `Draft` button's disabled state all read the same call, so they cannot disagree.
- **Bots** take one of the five strongest eligible rather than the single strongest, so a table
  of bots does not play the same draft every time; positional need only bites once the rounds
  left stop outnumbering the holes. They pace at 1.5–3.5s, simulated humans at 2.4–5.2s.
- **Every pick goes through one `commit`**, and the choice is computed *inside* the state
  updater so it reads the squad it is actually landing in. A timer that fires twice, or a
  click racing a timeout, cannot produce two picks from one turn.
- **On timeout** the system takes the cheapest eligible footballer, never the best — an
  auto-pick that matched your own would make the clock meaningless.
- Nothing is wired to Firebase. Per the standing fake-the-functionality rule the screen
  simulates the room rather than announcing the gap: bots pick on a stagger, the clock runs,
  chat sends, picks land in the XI, and a full 44-pick draft completes with every eleven
  filled.

#### Responsive

Three shapes, and the breakpoint that matters is not a Tailwind default:

- **≥1180px** — three columns, rail and portrait panel present.
- **768–1179px** — two columns, pool and pitch. The rail goes and its clock rides in the top
  bar rather than disappearing. Name plates drop to `72px / 8.5px`.
- **<768px** — one column, and the two halves take turns behind a `Who is left / The elevens`
  switch. **Pitch name plates are hidden entirely**: the whole pitch is inside 162px there, and
  eleven plates over that overlap each other, which reads worse than not having them.

Vertical rhythm is a height query (`max-height: 760px`), same lesson as the lobby — a `clamp()`
against `vh` never reaches its minimum at 568px tall. Chat drops at `max-height: 620px`.
Verified at 1280×800, 1280×700, 768×568 and 320×568: no scroll, no horizontal overflow, no
console errors, and no overlapping name plates on any of the four boards.

#### Gotchas worth not rediscovering

- **`text-[var(--x)]` silently does nothing in Tailwind v4.** A bare `var()` in an arbitrary
  value is ambiguous between a length and a colour, so it has to be `text-[length:var(--x)]`.
  The clock spent an afternoon rendering at the inherited 16px instead of 60px, with no error
  anywhere. `max-w-[var(--x)]` and `h-[var(--x)]` are unambiguous and do work, which is what
  made it hard to spot.
- **`.plate` outranked `opacity-0` and never hid.** Tailwind v4 puts utilities in
  `@layer utilities`, and unlayered CSS beats layered CSS regardless of source order — so
  `.plate { opacity: .36 }` in `index.css` won against the route switch's `opacity-0`, and the
  home page's full-bleed backdrop was rendering underneath *every* route including both
  lobbies. Fixed by moving the route switch onto a wrapper element. **Any future rule written
  outside `@layer` in `index.css` has the same power** — check before adding one.
- **A grid row defaults to `auto`,** which means the tallest item sets the height for every
  column. The rail refusing to shrink pushed all three columns past the fold at 1280×700;
  `.draft-grid` now states `grid-template-rows: minmax(0, 1fr)` and the rail carries
  `min-height: 0`.
- **`content-visibility: auto`** on the pool rows. All ~446 are in the DOM at once so that a
  footballer you cannot take stays visible where you would expect them; this skips the work for
  the ones outside the scroller, and `contain-intrinsic-size` stops the scrollbar jumping.

#### One usability bug worth remembering

On your turn the selection could sit on a footballer your own *previous* pick had just
blocked — a dead button with no stated reason to look elsewhere, and it happened constantly
because the thing blocking them was usually you. The clock landing on you now moves the
selection to the first player who is actually yours to take. **Once per turn, not
continuously:** selecting a blocked player on purpose is how you read why they are blocked,
and an effect that bounced you off them every render would make that impossible.

### The app frame — one bottom inset, every page (2026-08-20)

**`.app-frame` in `index.css`, applied once in `AppShell.tsx`.** Every screen in this app is
a single non-scrolling viewport that divides its own height between a header, some rows and
a footer, and each of them used to claim `h-[100dvh]` and measure its rhythm in `vh`. That
is a lie in a real browser window: a maximised window is not a full screen, and a tab strip,
an address bar, a bookmarks bar and a taskbar all come out of it in amounts that differ per
machine, per profile and per zoom level. The bottom of every page ended up hugging the
window edge, and on Mert's own machine the draft screens hung off it.

Two things are now declared once, in the shell, and read by all four screens:

- **`--app-inset-bottom`** — `clamp(3rem, 11vh, 7rem)`, collapsing to `1.25rem` under 620px
  tall. One figure for the whole app: a screen that sits off the bottom edge by one amount
  and its neighbour by another reads as the page having moved when you navigate. Routes
  spend it as **padding on their own content, never on the frame** — the lobby's left
  surface and the home page's plate still have to reach the bottom of the window; only what
  you read stops short of it. `.lobby-half`, `--draft-pad-y-bottom` and `--spin-pad-y-bottom`
  are all just this token now.
- **A size container** (`container-name: app`). Routes are `h-full` inside it and size their
  vertical rhythm in **`cqh`**, and their height breakpoints are `@container app
  (max-height: …)` rather than `@media`. Same number as `vh` today; the point is that no
  screen assumes it owns the window any more, so nesting anything inside the shell later
  cannot silently break four layouts at once.

**No route may write `100dvh` or `100vh` again.** The shell is the only element that knows
how big the window is. Everything else is `h-full` inside the frame.

**Superseded the same day** by the symmetric-inset pass directly below — the single
`--app-inset-bottom` figure above became two tokens, `--app-inset-x` and `--app-inset-y`.
Kept here as the record of why a size container exists at all.

### The app frame, symmetric (2026-08-20, same day)

**Four routes, four different padding formulas.** Before this pass Home, both lobbies, Free
Pick and Spin the Wheel each wrote their own `px-[clamp(...vw...)]` for their sides, at four
slightly different numbers, and the bottom figure (`--app-inset-bottom` above) was inflated
well past the others specifically to guard against browser chrome. The result: no two edges
of any one screen matched, and no screen matched any other screen either. Mert's ask,
stated broadly — *left should equal right, top should equal bottom, on every common modern
browser, and it should hold up without re-checking every time a size on the page changes* —
amounts to replacing four guesses with one shared pair.

**`--app-inset-x`** (left = right) and **`--app-inset-y`** (top = bottom) are now the only
two padding tokens, declared once on `.app-frame` and read by all four routes as
`px-[var(--app-inset-x)] py-[var(--app-inset-y)]`. Nothing downstream writes its own
`px-`/`py-`/`pb-` figure any more. The two axes are **not** forced to equal each other — `x`
is driven by `dvw`, `y` by `dvh`, so a wide window naturally gets more side padding than
top-to-bottom room and a tall one the reverse — only left-vs-right and top-vs-bottom are
guaranteed:

```css
--app-inset-x: clamp(1.25rem, 3.4dvw, 3rem);
--app-inset-y: clamp(1.25rem, 3.4dvh, 3rem);
```

`dvw`/`dvh` rather than `vw`/`vh` on principle, not because it changes the number today: in
every evergreen browser (Chrome, Opera and the rest of the Chromium/Gecko/WebKit family) the
viewport unit already excludes chrome, so the old `--app-inset-bottom`'s generous 7rem
ceiling was guarding against a measurement error that doesn't actually exist on desktop —
what made the bottom look short was the four screens disagreeing with each other, not the
number being wrong. `--app-inset-bottom`, `.lobby-half`, `--draft-pad-x/-pad-y/-pad-y-bottom`
and `--spin-pad-x/-pad-y/-pad-y-bottom` are all gone; the short-viewport override
(`@media (max-height: 620px)`) is gone too, because the clamp's own floor already carries
every screen down to the same 1.25rem minimum together, so there's no separate breakpoint
left to keep in sync by hand.

**Component sizes that used to jump between two hand-picked pixel values at one remembered
breakpoint are now a single `clamp()` against `cqh` instead**, on the same reasoning: the
draft clock, the portrait panel, the pitch nodes on both draft screens, and the wheel
screen's seat discs / report type / countdown figure. Each is `clamp(min, (max/8)cqh, max)`
— the `/8` falls out of the layouts having been drawn at an 800px-tall container, so the
preferred term lands exactly on the old "large" value there and glides continuously down to
the old "short-viewport" value instead of snapping at one height. The point of writing it
this way rather than tuning a fresh pair every time: a size picked anywhere in the app can be
turned up or down later without re-deriving a second value to match it at some other height.
**Left alone, deliberately:** the wheel screen's row heights (`--spin-row-top`,
`--spin-row-bottom`) and its name plate (`--draft-name`, `--draft-name-size`) — the rows are
cut harder than a smooth curve would to make room for the grid beside them, and the name
plate's width goes *up* as its type goes *down* at short heights, which no monotonic formula
can express. Both stay as a hand-tuned breakpoint pair.

Verified in a browser at 1280×800, 1280×700 and 320×568 on Home, the multiplayer lobby, Free
Pick and Spin the Wheel: left padding equals right, top equals bottom, on every one of them,
at every size, with no horizontal overflow and no overlap. `npm run build` and `npm test`
both pass.

**One incident worth recording, unrelated to the padding work itself:** `public/botModels`
used to be a real OS symlink to `src/data/botModels`, made while symlinks happened to work
on this machine. This repo's git is configured `core.symlinks=false` (typical without
Developer Mode or an elevated shell on Windows), so git had already been committing that
path as four ordinary dereferenced files, not a symlink. A `git checkout`/`merge` earlier in
this same session resolved through the still-real on-disk symlink while replacing it with
those tracked regular files, and deleted the actual content at `src/data/botModels` in the
process — a Windows directory-symlink deletion footgun, not anything the padding change
touched. Both paths were independently tracked in git history, so `git checkout --
src/data/botModels/` recovered the four files byte-for-byte (verified against the committed
blobs) and nothing was lost. `public/botModels` is now a plain directory holding its own
copy, matching what git already tracked — there is no symlink left to resolve through, so
this specific failure mode can't recur here.

### The Spin the Wheel draft screen (built, 2026-08-20)

`src/routes/SpinDraft.tsx`, reached through `Draft.tsx`, which now dispatches on `formatId`:
`spin-the-wheel` gets this screen, everything else gets the Free Pick one. They share the
engine, the pool loader, `PitchView`, `PlayerSpotlight` and `DraftChat`; what differs is
where a turn's board comes from. New parts are `src/lib/wheelEngine.ts` (pure) and five
components in `src/components/draft/` — `SpinWheel`, `WheelPool`, `PositionSelect`,
`NarratorFeed`, `TurnIndicator`.

**Where it came from:** layout **08 · Orbit** of `mockups/spin-wheel.html` — one sun, four
satellites, none of them touching it and none close to its size. Mert then re-tuned it by
hand in `mockups/orbit-tuner.html` (a drag-and-resize slide canvas built for the purpose):
the wheel moved to the top left and roughly doubled, the pool and portrait stacked into a
centre column, the eleven took the right, chat went under the wheel, and two panels were
blocked out for a **narrator** and a **turn indicator** that the exhibition frame had no
equivalent of. That tuned arrangement is what was built.

#### What is on screen

Header — the format's name, the round, and one status line (`Your pick.` / `Priya is
picking.` / `The wheel is spinning.`) with the state dot. Then a three-column grid over three
rows — see **Spin the Wheel: this pass** below for the current column widths and row layout,
which have moved on from what shipped 2026-08-20.

- **The wheel** takes the left column across two rows, sized `min(100cqw, 100cqh)` so it is
  the largest circle its cell allows. One conic gradient for the face, one transform for the
  spin, and a counter-transform per chip on the same curve and duration so a crest is
  upright at every frame rather than only at the end. The hub sits outside the rotating
  element — a hub that has to be un-spun shimmers for three seconds a turn — and reads
  `The wheel / Spinning`, then `Landed / Serie A`, then `The draft / Complete`. The landing
  is jittered inside its slice, because a pointer that stops dead centre every time looks
  like a lookup.
- **The turn indicator** sits under the wheel — the seats as connected discs with the
  snake's direction, and the clock as a hairline draining along the bottom edge rather than
  a number, except on your own turn where the number is the whole point.
- **The pool**, centre — `{landed} · open slots`, or `· Priya's slots` when the clock is on
  somebody else. Rows are position code in accent, crest, name. The portrait sits beside the
  list rather than above it, and chat is stacked under the whole pool panel — see below.
- **The report**, top right — the narrator with a panel instead of a line. Free Pick has one
  event per turn; a spin has two, which is eighty-eight over a draft, so the latest is set
  large and the ones it replaced stay under it, dimming.
- **The eleven**, right — `PitchView` unchanged, reading `--draft-node` / `--draft-name` set
  smaller here than on the Free Pick screen. The orbit gives the eleven a smaller cell, and
  the two centre backs and the keeper stack into the same corner of any 4-2-3-1.

#### Search and the position filter

**A search field and one dropdown, not a chip row.** Ten chips is the right control when
every one of them is always live, which is what Free Pick's pool is. Here the board is
already twice narrowed — by the slice and by the shape of the picker's own eleven — so most
chips would be dead most of the time. `PositionSelect` lists only the positions actually on
the board, hand-rolled rather than a native `<select>` because the native list paints in the
platform's colours, which on a near-black page is a white slab. Both controls go quiet while
the wheel is turning, and both reset on a new spin: a filter carried over from the last
category is a filter that shows you an empty list.

#### The rules it implements

- **The category is fixed once, at the start** (R5-Q1). `top-5` / `all` leave league, club
  and nationality open and the wheel takes **league** — five slices, five real marks. A
  single-league Scope has already fixed league, so it drops to clubs.
- **One equal slice per entity holding at least one legal footballer for the drafter on the
  clock** (R8-Q7) — so the wheel is rebuilt per turn, not once for the table, and a league
  whose remaining players all play where you are already full is not on it at all.
- **The pick itself is a free pick** — same snake, same slot gate, same A–Z. **No
  constraints** (R5-Q2), so `blockedReason` runs with `'none'` and there is nothing to strike
  through: a footballer who cannot be taken is not in this category or not in this shape.
- **Empty wheel falls back to the whole remaining pool for that turn** (R2-Q4), captioned
  `Open board`.

#### One race worth not rediscovering

A pick lands one commit before the effect that starts the next spin runs, so for exactly one
render `phase` still says `landed` while `overall` has already moved on. That window was long
enough for the report to announce the next turn's landing *before* the pick that caused it,
and for the pool to be rebuilt out of the old category against the new drafter's squad. The
landing is now stamped with the turn it was spun for (`landedTurn`) and everything reads one
derived `settled` flag, which makes the state unrepresentable rather than merely rare.

#### Verification

A full 44-pick draft played out in the browser with every one of the four elevens filled, no
scroll and no console errors. `src/lib/wheelEngine.test.ts` plays the same draft in Node
against a synthetic pool and asserts the wheel never runs dry — that is this format's one
failure mode that Free Pick does not have, since the board is narrowed twice before anyone
sees it. Checked at 1920×926, 1440×900, 1280×800, 1280×700, 1024×768 and 375×667.

#### Two judgement calls worth overruling if wrong

- **The wheel's five slices are league colours**, mixed 66% into black — `--color-league-*`
  in `index.css`, the second licensed exception to the four primes after the crests, and the
  only one that is not artwork. It is what the tuned mockup drew and it is the wheel's whole
  legibility; the one-saturated-accent rule is untouched, since nothing is ever actionable
  because it is one of these. Non-league wheels fall back to a ramp mixed from the primes.
- **The pool follows the drafter on the clock**, not you, because the wheel does — the two
  would otherwise disagree about what is on the board. It costs nothing, since every
  drafter's eleven is already open to everyone.

#### Spin the Wheel: this pass (2026-08-20, `size-tweaks`)

A fast Tachyon-mode pass, run after the screen had been looked at in a browser for a while.
Four changes, all Spin the Wheel-specific except the last:

- **The wheel gave up 25% of its own column width** (`1.62fr → 1.215fr`) to the middle
  column (`1fr → 1.405fr`), and the wheel's own row heights shrank to match
  (`--spin-row-top`, `--spin-row-bottom` both cut). The freed width went to the pool and
  chat, which needed the room once the portrait moved inside the pool (next point).
- **The portrait moved inside the pool panel**, beside the list rather than in a row of its
  own above it — the same placement Free Pick's pool already uses. `WheelPool` now takes a
  `portrait` prop exactly the way `PlayerPool` does, and the list/portrait split inside that
  row is **65/35** (`flex-[65]` / `flex-[35]`, Tailwind's flex-grow ratio, not a CSS width —
  see the split note below for why a ratio and not a grid-row percentage).
- **Chat and the turn indicator swapped places.** Chat used to sit under the wheel, held to
  30rem and centred, because "a conversation is a narrow thing and the sun above it is
  round." With the portrait now living inside the pool panel, chat moved to sit under the
  *pool* instead — a rectangular panel, not a round one, so the 30rem cap and the centring
  were dropped; chat now runs the pool panel's full width. The turn indicator took chat's
  old spot under the wheel.
- **Pool and chat split 66/33 by height**, inside a shared grid cell (`mid`, spanning all
  three of the orbit's rows in that column) rather than off the grid's own row tracks. The
  wheel, narrator and pitch panels all still share those row tracks with each other, so
  sizing pool-vs-chat directly off `--spin-row-top`/`--spin-row-bottom` would have dragged
  wheel-vs-turn and narrator-vs-pitch along with it in the same ratio. Nesting pool and chat
  in their own flex column inside one grid cell (`flex-[66]` / `flex-[33]`) makes the split
  exact and isolates it from the other three panels. When chat hides at short viewports
  (`@container app (max-height: 620px)`), the pool's flex-grow absorbs the freed space on
  its own — no `grid-template-areas` override needed for that case any more.
- **The pool's `Draft →` button is about half its old size** (`px-[18px] py-[9px] →
  px-[9px] py-[4px]`) — Free Pick's own button is untouched.
- **Pitch nodes show a face on preview, not only on confirmation** (`PitchView.tsx`, shared
  by both draft screens): the node in a `pending` slot now renders the face-anchored photo
  of the player about to be drafted, the same way a confirmed pick's node does, rather than
  falling back to the accent-text position code until the pick lands. `Draft.tsx` also
  picked up a **Back to home** link and staggered `fx fx-soft` entrances on the rail and
  pool columns, matching the transition treatment the rest of the app already had.

Verified with `npm run build` (typecheck + build) and `npm test`; not re-checked in a
browser this pass, per Mert's explicit "no playwright."

### The Deal or No Deal draft screen (built, 2026-08-20, `dond-ui`)

`src/routes/DondDraft.tsx`, reached through `Draft.tsx`, which now dispatches on `formatId`:
`spin-the-wheel` gets the orbit, `deal-or-no-deal` gets this screen, everything else gets
Free Pick. All three share the pool loader, `PitchView`, `TableStrip`, `DraftChat` and
`Narrator`; what differs here is that there is no board to choose from at all. New parts are
`src/lib/dondEngine.ts` (pure) and two components — `BoxGrid`, `BoxStage`.

**Where it came from:** layout **18 · Sections** of `mockups/dond.html`, built on the earlier
`pre-dond-ex-q` branch and already merged — the Free Pick screen's own three-column shape
with a grid of ten boxes standing in for the pool. That exhibition settled the box's texture
(ribbed weave, lid seam, clasp), the stick/hear and take/back controls as the largest in the
app, the banker's offer drawn at the same portrait weight as an opened box, and a narrator
held to one line — see `HANDOVER.md`'s record of that run, now folded into this section and
removed.

#### What is on screen

Top bar — narrator and table strip, same as Free Pick. Then three hairline-divided columns:

- **Rail** — Round (ordinal only, same as Free Pick), **This round fills** (the round's
  designated position, set large in accent — CDM at up to 60px), and chat. No "Used" panel:
  nothing in this format gates on club or nation.
- **The boxes**, centre — `2N` sealed lids in two rows for an `N`-drafter table, anonymous
  until opened (no per-box "whose" marker — the narrator says who). Opening one is yours to
  do only on your own turn; everyone else's opens are simulated. A box coming open, or the
  banker's offer, takes over the column as a full-bleed stage — the same `.spotlight-photo`
  face-anchoring formula the portrait panel and pitch nodes already use — with the decision
  (stick/hear, or take/back) docked across the bottom of the photograph itself.
- **The elevens**, right — `PitchView` unchanged, behind the same drafter tabs the other two
  screens use.

#### The rules it implements

- **A strict round robin, never a snake** (R5-Q7): `dondEngine.seatOrder` rotates one seat
  per round and does not reverse. `draftEngine.seatAt` is not used by this screen at all.
- **The eleven rounds are a shuffle of the formation**, not eleven independent random draws
  (`dondEngine.roundOrder`) — every drafter fills every slot exactly once, which is what
  makes the format self-completing with no graveyard (R3-Q2).
- **Boxes follow the pool's own higher-ability skew** (R6-Q2), not an even draw —
  `dondEngine.skewedSample` reuses the `p ∝ exp((ability − max)/10)` formula the bot training
  design settled on.
- **The banker's offer is flat and position-based**: `bankerTarget` prices at fifteen points
  under the average ability of whatever is still sealed (R3-Q4/R8-Q5/R9-Q6); `bankerOffers`
  draws the named footballer from the undrafted pool for that position, excluding this
  round's own boxes, one distinct name per drafter who asked (R6-Q8).
- **Going back to the boxes forces the next one** — no second choice once you decline the
  offer, per the briefing's own rule.
- **Unopened or rejected boxes return to the pool at round end** (R8-Q6) — handled by
  construction rather than as a separate step: a box player is only removed from the
  available pool once *somebody* ends the round holding them, so an unclaimed box player is
  simply never taken out of circulation.
- **Timeout defaults to the least-committal option** (Turns & Timers): stick, and take the
  offer. Timing out while choosing a box opens a random shut one, since there is no
  "no-help" option for the one decision that has to happen.

#### Judgement calls made without asking, worth a look

- **Results commit live, not at round end.** The pitch fills as each seat settles rather than
  waiting for the whole round to finish — chosen so a drafter can see the table filling in
  real time, and because it makes the box-return rule fall out of the data model for free
  (see above) instead of needing an end-of-round sweep.
- **HANDOVER.md's flagged question — whether "one box opened, yours just opened" (as R11 was
  literally worded) or "everyone has opened, offers are live" is the state to build toward —
  was resolved toward the rule as written**: offers only go out once every seat has opened
  once. The exhibition frame is reachable but is not the state the screen opens on.
- **Bots read only the boxes already opened this round**, never the sealed ones — the same
  information a person at the table has. `botSticks` / `botTakesOffer` are heuristics, not
  the exported ML policy; wiring the real bot models into any draft screen is still separate,
  deferred work.

#### Verification

`npm run build` (typecheck + build) and `npm test` — `src/lib/dondEngine.test.ts` covers the
round shuffle, the round-robin order, the box draw, and the banker's pricing/offer selection;
`src/routes/DondDraft.test.tsx` plays a box open through to a stuck pick and confirms the turn
hands to the next seat rather than reversing. Not checked in a browser this pass, per Mert's
explicit "no playwright."

### The Auction draft screen exhibition (2026-08-21, `auction-draft-ui`)

**Where:** `mockups/auction.html`. Same self-contained gallery shell as the other four — 1280×800
frames at half scale, click one to zoom to full width, opens straight off disk, no build step and
no server, plus the per-frame **Hide** button the Deal or No Deal run introduced.

**Twelve layouts, not twenty.** Palette fixed to petrol, type held to Oswald + Inter, no motion —
the three standing exhibition rules. What is different about this run is that it was built to a
**list of twelve non-negotiables set before any layout was drawn**, so no frame is distinguishable
by which requirement it dropped. Every one of the twelve satisfies all twelve:

1. Pitch view with drafter tabs. 2. A turn indicator. 3. Chat. 4. **A fixed centre stack** — the
count of what is left at the top of the player displayer, the displayer, then the countdown, then
the lobby members side by side with their bids plainly visible. 5. A back-to-menu control.
6. Events legible with or without a narrator. 7. **No sentences anywhere.** 8. Player photographs
and club crests in their own colour with no effects. 9. Upcoming lots a mystery, previous lots
shown. 10. The stadium loud, not faint. 11. Pitch nodes are faces. 12. Bidding drawn as real time.

01 The block · Marquee Hero — 02 Floodlight · Photographic — 03 The rostrum · Split Studio —
04 The ledger · Stat-Led — 05 The board · Bento Grid — 06 Paddle · Index-First — 07 Exchange ·
Workbench — 08 Podium · Map/Diagram — 09 Lots · Catalogue — 10 The name · Type Specimen —
11 Tote · Component Playground — 12 Terrace · Ecosystem Index.

**One internally consistent draft state across all twelve**, so the frames are comparable: Auction ·
Top 5 leagues · 5 drafters (You, Priya, Sam, Bot 1, Bot 2) · 800M each at start · lot 23 of 75 ·
Kylian Mbappé (ST, Real Madrid) on the block · opening 140M · held at 165M by Sam · 9s. Your four
purchases are Alisson, Saliba, Hakimi and Rice for 295M, which is where the 505M left comes from.
Every name, club, nation, age, crest and price is a real row of `player_data.csv`; the 75-lot
figure is the `15 × N` cap and the 800M figure is the documented ×19 budget at Top 5.

#### Three decisions the constraints forced, worth carrying into the build

- **A real-time auction has no turn, so the turn indicator is a *holder* readout** — who currently
  holds the lot, at what price — welded to the countdown that their bid resets. There is no turn
  language anywhere on any frame, and the three increment buttons are live for every seat at once.
- **The increment buttons carry two numbers**, the step and what it lands on (`+5` over `170M`).
  A step button that names only its step makes you do arithmetic against a clock.
- **The sealed tile** (`24 · ?`) is how non-negotiable 9 is drawn. Every frame ends its record of
  sold lots with one, so the boundary between what you can see and what you cannot is a visible
  edge rather than an absence. Unsold lots stay in the record (lot 19, Pedri) — R8-Q4 makes that a
  real event and it belongs on screen.

#### Three inventions specific to one frame each

- **07's price ladder** — opening bid, live high, and where each of the three steps would land,
  plotted on one horizontal scale. The only place a bid is a position rather than a figure.
- **08's podium** — bid drawn as bar height against the opening bid, so who is winning is a shape
  before it is a number, and a passed seat is a dashed stub rather than merely dimmed.
- **12's index band** — all five squads as eleven filled-or-empty cells plus each drafter's last
  purchase, so the four boards you are *not* looking at still tell you something.

**Status: resolved.** Layout **01 · The block** (Marquee Hero) is what got built, with one
modification Mert asked for on picking: **the Sold record uses layout 09's full square
photographs** rather than 01's ruled rows of 22px discs. Built the same day — see **The
Auction draft screen** below, which supersedes the frame wherever they disagree.

**Two site-wide changes this run states:**

- **Player photographs and club crests carry their own colour, with no filter at all** *(Mert,
  2026-08-21)*. This is the first screen in the app to do it, and it is intended to go everywhere.
  It narrows the `--color-tint` rule under Design tokens — the `mix-blend-mode: color` wash is now
  the **backdrop's** treatment, not "every photograph's". The never-recolour-a-crest rule is
  unchanged and this only strengthens it.
- **The stadium plate is loud** — `.55–.90` across these frames against the `.30–.36` the earlier
  runs used, because the plate is what gives the site life. It stays monochrome and tinted on
  purpose: with the photographs now in colour, the plate is what makes the faces read as the only
  colour on the page. Flagged as a judgement call — a full-colour plate is one line, but it would
  break the four-prime palette everywhere at once.

**Both are now live in `src/`, but only on the Auction route.** The Auction screen draws every
photograph and crest unfiltered and runs the plate at `.72` full bleed (`.plate-block` in
`index.css`, a fifth placement in `AmbientBackdrop`). The other three draft screens, the two
lobbies and the home page still run their own `.30–.55` placements. Rolling the loud plate out
to them is a separate pass and has not been done — the change reads very differently under a
pool of four hundred rows than it does under one photograph.

### The Auction draft screen (built, 2026-08-21, `auction-draft-ui`)

`src/routes/AuctionDraft.tsx`, reached through `Draft.tsx`, which now dispatches all four
formats. New parts are `src/lib/auctionEngine.ts` (pure) and three components in
`src/components/draft/` — `AuctionBlock`, `BidBoard`, `SoldRecord`. It shares the pool loader,
`PitchView`, `TableStrip` and `DraftChat` with the other three, and reuses the `.spotlight-frame`
/ `.spotlight-photo` face-anchoring formula for the displayer.

**Layout 01 · The block**, as picked, with the one modification asked for: the Sold record is
layout 09's square-cropped cards rather than 01's ruled rows. It is a **Tachyon-mode** pass — no
brainstorming, no plan phase, defaults chosen and stated here rather than asked mid-build.

#### What makes it a different screen, not the same screen with money on it

**There is no turn, so there is no turn indicator and no turn language anywhere on it.** Every
seat's increment buttons are live at once, any seat can raise at any moment, and the clock
measures *inactivity* rather than anybody's window — a bid from anyone sends it back to full and
a lot sells when the clock runs out on it. What the screen shows in place of a turn is a
**holder**: who has the lot, at what price, welded to the left end of the countdown rail their
bid resets.

**There is also no narrator.** Non-negotiable 6 said events had to be legible with or without
one and non-negotiable 7 banned sentences outright, and layout 01 has neither — so the build
doesn't either. Events are *drawn*: the hammer lands across the photograph at display size and
holds for 1.9s, the sold record keeps the history, the holder readout carries the present tense,
and the HIGH tag moves between bid cards. **Nothing on this screen is a sentence** — the only
prose anywhere in the column is what people type into chat.

#### What is on screen

Top bar: `Back to home`, an accent `Auction` chip and the scope chip, with the table strip
opposite. The strip's accent disc marks **the holder**, not a turn. Then three hairline-divided
columns — `236px / 1fr / clamp(256px, 22vw, 296px)`:

- **Sold**, left — the last four lots as square face cards, newest first, two across: photograph,
  surname and price, crest and buyer. Your own purchases are drawn in accent; an **unsold lot
  stays in the record**, dimmed whole, because passing on a footballer is a real event *(R8-Q4)*
  and a record that only listed sales would rewrite what happened. Under it, the **sealed tile** —
  `24 · ?`. Nothing on the screen previews the queue, so the boundary between what you can see
  and what you cannot is drawn as an object rather than left as an absence. Chat sits beneath.
- **The block**, centre — the fixed stack, in the order the non-negotiables set it: the count
  (`Lot 23 / 75` · `52 left`) at the top of the displayer, the displayer, the countdown, the five
  drafters side by side with their bids, then the three steps. The footballer is full bleed and
  face-anchored, in their own colour, with the opening bid in the caption.
- **The elevens**, right — `PitchView` behind the same drafter tabs the other three screens use,
  with `Filled n / 11` and `Left {budget}M` under it. Every board is open to everyone the whole
  way through, same as everywhere else.

**The increments carry two numbers each** — the step and what it lands on (`+5` over `170M`). A
button that names only its step makes you do arithmetic against a clock. **The first bid on a lot
is exactly at the opening price**, so the three steps are redundant in round one and mask down to
one `Bid` and a `Pass`, exactly as the rule says. A step you cannot afford is disabled, and
nobody bids against themselves.

#### The rules it implements

- **The lot list is capped at 15 × lobby size**, built position-by-position first — `N` per
  single-occupancy slot and `2N` for CB, which is `11N` — with the remaining `4N` drawn from the
  rest of the scoped pool under the settled `p ∝ exp((ability − max) / 10)` skew. The order is
  then shuffled: reveal order is fully random *(R6-Q1)*.
- **Budget is `(average derived price of the scoped pool) × 19`, rounded to the nearest 100M**
  *(R8-Q0 as amended)*. This is the first place in `src/` that figure has existed, which closes
  the follow-up the training spec flagged: there was no frontend budget number to update, so ×19
  is simply what shipped.
- **Opening bid is 70% of derived price, rounded to the nearest 5M.**
- **A purchase lands straight in an open slot; only when every slot for that position is full
  does it overflow** *(R7.2-Q1)*. The spares panel is rendered **only on your own board and only
  once there is something in it** — a spare is private *(R5-Q8)*, and an empty panel for a state
  most drafts never reach is furniture. Clicking one performs the **two-way graveyard swap**
  *(R7.3-Q2)*: it goes into its slot and whoever was holding it comes back out. That works after
  the draft ends too, which is all that survives of post-draft editing under a hard position gate.
- **Bidding is not gated by slot status** *(R5-Q6)* — a seat with a full XI can keep raising, and
  the bots do, at about a third of their normal appetite.
- **Unsold lots** go to the pile and **backfill** fills any empty slot at the end with the
  cheapest still-eligible footballer, drawn from the scoped pool minus everything sold — so it
  reaches the un-auctioned remainder first and the unsold pile only after. The Squad Completion
  Guarantee holds by construction.
- **The hard global stop** *(R3-Q10)*: the auction ends the moment no seat with an open slot can
  afford the opening bid on any remaining lot, or when the lot list runs out.

#### Judgement calls made without asking, worth overruling if wrong

- **Timers off still gets a countdown, at the 15s default.** The clock is this format's own
  closing mechanism rather than a courtesy to a slow drafter — with no turns, it is the only
  thing that ends a lot, so switching it off would leave a lot open forever.
- **A bot that has been priced out is marked passed** rather than quietly stopping. Its valuation
  is fixed for the lot's length and its budget only falls, so it can never come back in — saying
  so is what draws the four dimmed cards next to the one holding it, which is the read layout 01
  gets from `.bid.out`.
- **Bots are heuristics local to the engine**, like the other three screens: a per-lot ceiling
  from derived price, positional need and how many slots are left, with a deterministic per-seat
  "taste" so a table doesn't agree on every valuation. The exported ML policy is still not wired
  into any draft screen.
- **The pitch previews your buy only while you actually hold the lot.** A preview of somebody
  else's lot landing in your XI is a lie.
- **The plate change is Auction-only for now** — see above.

#### One race worth not rediscovering

A lot closes when its clock reaches zero, and a *new* lot renders once before its own clock
effect has run — so a plain `seconds` state is still holding the previous lot's zero at that
moment and hammers the new lot down unsold before anybody has seen it. The countdown is
therefore stored as `{ key, left }`, stamped with the lot-and-bid it belongs to, and the closing
effect refuses to act on a value whose key isn't the current one. That makes the state
unrepresentable rather than merely rare — the same fix the Spin the Wheel screen needed for its
own one-render window.

#### Gotcha worth not rediscovering

**`cqh` resolves against the nearest size container, and `.spotlight-frame` is one.** Three of
this screen's type sizes (`--auction-name`, `--auction-open`, `--auction-stamp`) are read inside
the displayer, so their `cqh` is a percentage of the *photograph's* box, not of the app frame's
800px — the usual `max / 8` derivation is wrong for them and gives a size that sits on its floor
forever. They are scaled against the displayer's own ~420px instead, and marked as such in the
CSS. Everything else on the screen sits outside that container and uses the normal derivation.

#### Verification

`npm run build` (typecheck + build) and `npm test` — 40 tests, 11 files, all passing.
`src/lib/auctionEngine.test.ts` covers the opening-bid rounding, the ×19 budget, the `15 × N` cap
and its position coverage at 2 and 5 drafters, and that a bidder stops at its ceiling and never
bids past its budget. `src/routes/AuctionDraft.test.tsx` opens a lot, asserts the holder readout
and the absence of any turn language, bids at the opening price and confirms the three steps come
out and that you cannot raise against yourself. **Not checked in a browser this pass, per Mert's
explicit "no playwright"** — the layout maths was done by hand against 1280×800, 1280×700 and
320×568 instead, which is where the mobile bid-card rules below 768px came from.

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
3 example players: John, Paul, Ringo. Each starts with a budget calculated dynamically from
the pool: **(Average Derived Price of all players in the selected pool) × 19, rounded to the nearest 100M EUR** *(R8-Q0 / amended 2026-08-19)*.
A footballer comes up starting at a predetermined opening bid (70% of derived market value, rounded to nearest 5M).
The **first bid on a lot is exactly at the opening price** *(clarified 2026-08-19)*, so increment buttons are redundant in the first round and mask down to {Pass, Bid}.
Players bid in real time. The auction turn timer represents the maximum allowed inactivity without a bid:
**any valid bid resets the countdown timer back to its full duration** (e.g. 15s) *(R8-Q3)*.
A player is sold to the highest bidder only when the full timer expires with zero new bids.
If no one bids at opening bid and the initial timer expires, the footballer is **discarded into an unsold pile**
and is only resurfaced for end-of-auction backfill if no other viable players remain in the pool *(R8-Q4)*.

If the buyer has an open slot for that footballer's position, it fills the slot directly. If every slot
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
as: every footballer **on the lot list** has been through the block — the list is capped
at 15 × lobby size, see below — *or* every player still short of a full XI can no longer
afford any unsold eligible footballer for their open slots — whichever comes first), any
player left with empty slots has them auto-filled with the **cheapest still-eligible
unsold footballers** for those positions. Under the cap, "unsold" means the whole scoped
pool minus whatever was sold, so backfill draws first from the footballers the cap kept
off the block, and only falls back to the unsold pile — the ones that went to the block
and drew no bid — when nothing else eligible remains, exactly as R8-Q4 already
specified. Running out of money isn't prevented, it's just not punished with a
permanently broken squad — you end up with worse players, not fewer players. This is
also the default behavior when a pick/bid timer expires unattended (see Turns &
Timers). Deal or No Deal has no budget in the briefing, so "running out of money"
doesn't apply there.

**Bidding is real time, not turn-based** *(restated 2026-08-21 as a constraint on the screen)*.
Every seat can raise at any moment; there is no rotation, no "your turn", and no per-seat window.
The screen must therefore show a **holder** — who currently holds the lot and at what price —
rather than a turn indicator, and every seat's increment controls stay live at once. What the
countdown measures is inactivity, not a turn: see the timer rule above.

There's **no designated opener/nominator** — any footballer can be bid on by anyone the
moment it appears, no rotating turn to bring it up. *(R2-Q5)* Footballers surface
**one at a time**: the system auto-reveals the next one as soon as the current one
sells or passes. *(R3-Q1)* The reveal order is **fully random** — no quality curve,
best/worst-first, or position cycling. *(R6-Q1)*

**The lot list is capped at 15 × lobby size** *(settled 2026-08-19, `auction-training`
branch)*. An auction puts at most `15 × N` footballers on the block for an `N`-drafter
table — 30 lots at 2 drafters, 75 at 5 — drawn from the scoped pool, never the whole
pool. Before this the auction ran the entire scope: 546 lots at All Players, 463 at
Top 5, 167 at Premier Division. That was never playable at a 15s bid timer, and it is
what made the Auction bot's training episodes 50–100× longer than any other format's.

The cap sits on top of the existing per-draft coverage rule (Open Question #2, R2-Q10):
the lot list is **built position-by-position first** — `N` eligible footballers for each
single-occupancy slot and `2N` for CB, which is `11N` — and the remaining `4N` lots are
filled from the rest of the scoped pool under the usual skew toward higher ability. Every
table can therefore fill its XI off the block, with about a quarter of the lots as
contested surplus. A uniform random draw of `15N` would **not** hold that: at a 5-drafter
table it yields 4.8 LBs and 5.1 RBs on average against 5 needed, leaving the thin
positions short roughly half the time and pushing the work onto backfill.

Bid increments are **flat, stepped amounts**, offered as a small fixed set of buttons:
**+5M / +10M / +25M** available at every price point — the steps don't scale up with
the current price. *(R2-Q3, R3-Q9, updated to +5M/+10M/+25M in R9-Q3)* A footballer's **starting (opening) bid** is **70%
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

The AI proposer's offer is **drawn from the remaining undrafted pool players for that round's designated position** (excluding players inside the current round's boxes), selected with an ability rating **15 points lower than the average ability of the remaining unopened boxes for that round's position** (`Average Unopened Ability - 15.0`) *(R3-Q4, R8-Q5, R9-Q6)* — sticking with the boxes should
feel like the tempting choice, taking the deal a concession. That calculation
is **flat and position-based only** — the same for whoever it's offered to that round,
not adjusted per-player for squad needs, budget, or history. *(R6-Q8)*

That round's boxes themselves follow the **same higher-ability skew** as the rest of
the pool (see Player Data Pool) — they aren't pulled evenly/representatively just
because they're boxes. *(R6-Q2)* At the end of the round, any **unopened or rejected box players are returned to the undrafted pool** *(R8-Q6)* (meaning only CB players could ever be drawn in a later round since all other slots occur exactly once in the 4-2-3-1).

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
not offered. *(R7.3-Q3)* If a player's previous picks ever leave them with zero legal options
for a position they still need (**constraint deadlock**), **the system does nothing and the game stays stuck** *(R8-Q1)* — no auto-waiver or artificial bailout. (Draft viability simulation contains this by blocking unviable configurations at the lobby level).

#### Spin the Wheel
The wheel is **never mixed** — no single wheel has club slices next to league slices
next to nationality slices. Every spin's wheel is entirely one category: all clubs, all
leagues, or all nationalities. *(R4-Q6, overturning the mixed-wheel reading of R3-Q3)*
Whichever single category is in play, the pick itself is a free pick in a snake draft —
including Free Pick's slot-full filtering above, since it's the same underlying pick.
*(R7.3-Q3)*

**Wheel slice distribution:** the wheel has **equal-sized slices for every entity** (club, league, or nation) that currently has at least 1 legal player available for the active drafter's open positions *(R8-Q7)*.

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
purchase can. *(R7.2-Q1)* The 15 × lobby size lot cap doesn't put this guarantee at
risk: the lot list is drawn position-by-position so every table can fill its XI off the
block, and backfill can still reach the un-auctioned remainder of the scoped pool if it
somehow can't. *(2026-08-19)*

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
picker exposed to players. *(R1-Q9)*

**Architecture & Execution:**
- **Separate Models per Format:** 4 dedicated, lightweight neural network policies (one each for Auction, Deal or No Deal, Free Pick, Spin the Wheel) *(R9-Q1)*.
- **In-Browser Execution:** The trained models run directly in the client browser using lightweight ONNX / JS weights with zero backend latency or server cost on GitHub Pages *(R9-Q10)*.
- **Organization:** Training scripts, simulation gyms, and checkpoint leagues reside in `scripts/training/`. Exported browser-ready weights reside in `src/data/botModels/` *(R10-Q10)*.

**Machine Learning / Reinforcement Learning Training Pipeline:**
- **Algorithm:** Multi-Agent **PPO (Proximal Policy Optimization)** with Actor-Critic networks for stable policy gradient learning over discrete action spaces *(R10-Q1)*.
- **Training Volume:** **500,000+ drafts per format** in vectorized self-play simulation *(R10-Q7)*.
- **End-of-Draft Reward Signal:** Relative margin over the room — $\text{Reward} = \text{Bot Squad Score} - \text{Lobby Average Squad Score}$ *(R9-Q2)*.
- **Squad Score Metric:** Position-Weighted Ability Sum across the starting 11 *(R8-Q8)*:
  $$\text{Squad Score} = \sum_{i=1}^{11} \text{Current Ability}_i \times \text{Weight}_{\text{pos}_i}$$

| Position | Multiplier |
|---|---|
| ST | `1.0846` |
| AMF / CAM | `1.0624` |
| CM | `1.0612` |
| RW | `1.0342` |
| LW | `1.0322` |
| CDM | `0.9827` |
| RB | `0.9760` |
| LB | `0.9750` |
| CB | `0.9730` (each CB) |
| GK | `0.8358` |

- **Observation Spaces & Action Structures:**
  - **Auction:** Discrete actions are `Pass (0)`, `+5M`, `+10M`, and `+25M` *(R9-Q3)*. Action masking strictly disables unaffordable raises with $-\infty$ logits *(R10-Q6)*. Automated optimal slotting ensures the highest-ability legal player is always placed in the starting XI while unplaced players move to graveyard *(R10-Q5)*; graveyard overflow contributes 0 points to squad score *(R9-Q4)*. Observations include active player stats, opening & current bids, bot's budget & formation slots, opponent budgets & open slots, and remaining pool count *(R10-Q2)*. Episodes are bounded by the **15 × lobby size lot cap** — at most 75 lots at a 5-drafter table, 30 at a 2-drafter one — not by the size of the scoped pool *(2026-08-19)*.
  - **Deal or No Deal:** Two-step decision: Step 1 (Pick unopened box $\rightarrow$ `Stick` or `Hear Offer`), Step 2 (if hearing offer $\rightarrow$ `Take Offer` or `Open 2nd Box`) *(R9-Q5)*. Observations include active position multiplier, opened box player ability, remaining unopened box count & average ability, expected Banker offer (`Average − 15.0`), and current squad fill state *(R10-Q4)*.
  - **Free Pick & Spin the Wheel:** Full pool embedding matrix across all 546 players combined with a legal availability mask, allowing pure policy networks to select the optimal pick without heuristic handholding *(R9-Q7, R10-Q3)*.
- **Training Environments:** Self-play randomly samples table sizes from **2 to 5 drafters** *(R9-Q8)* across weighted scopes (50% All Players, 30% Top 5 Leagues, 20% Single Leagues) *(R9-Q9)*.
- **Evaluation & Convergence Criterion:** **Champion vs Challenger Checkpoint League** *(R10-Q8)* — periodic checkpoints are evaluated in head-to-head matches against the reigning champion model. Convergence is reached when the challenger consistently produces negligible win margin or the champion holds its title across prolonged training intervals.

**Deliberation & Live Game Inference:**
- **Natural Human Pacing:** In live interactive lobbies against humans, bots simulate natural human pacing with a **1.5–3.5s delay** before picking or offering, and bid with natural human rhythm in auctions *(R8-Q10)*. In ML training and simulation runs, execution is untimed and immediate.
- **Temperature Sampling:** Live move selection uses **Softmax sampling with Temperature $\tau \approx 0.6$** *(R10-Q9)* to preserve top-tier skill while introducing natural variation across games.

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
strictly representative of the full Scope. The lot list draws are weighted via a softmax curve: `p ∝ exp((ability − max_ability) / 10)` *(closes Open Questions #3, #16, #29, settled 2026-08-19)*. Every draft starts **completely
fresh** from the full pool — no memory of footballers used in past drafts, per-lobby or
site-wide. *(R4-Q10)*

**Current Ability calibration:** the original per-player ratings were cross-checked
against two independent rounds of AI deep-research groupings — players judged to be of
equal real-world caliber as of August 2026, grouped in threes (`gemini_quizzes/`) —
then refit with a regularized least-squares pass: each player is pulled toward
agreement with whoever they were grouped with, weighted by how much evidence exists for
them, while staying anchored to their original rating so weakly-evidenced players barely
move. Pre-calibration values were preserved in `player_data_ability_backup.csv` at the time —
that file was itself swept up and deleted in the 2026-08-15 workspace cleanup along with the
RL pipeline and prototype it ran alongside (see Status above), so it no longer exists.
**Corrected 2026-08-20**: this section previously still claimed the backup was preserved;
`player_data.csv`'s shipped ability column is the only surviving record of the calibration.

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
**graveyard swapping** — an Auction player can keep swapping their own graveyard footballers
against their XI after the draft ends, the same bump-swap mechanic as during Auction
(above), just no longer time-limited by the draft being live. *(R1-Q10, narrowed by
R7.3-Q5)*

**Free Pick, Spin the Wheel and Deal or No Deal are permanently locked upon draft completion** *(R8-Q2)* — no graveyard exists, and no post-draft player swapping, trading, or substitutions are permitted.

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
~~21. Free Pick constraint deadlock~~ Resolved R8-Q1: the game does nothing and stays stuck (no auto-waiver or artificial bailout; viability gating in the lobby prevents unviable configurations).
~~22. Host transfer on disconnect~~ Resolved R6-Q6: auto-passes to next-earliest joiner.
~~23. Indefinite blocking bids in Auction~~ Resolved R6-Q7: intended, no cap.
~~24. AI proposer offer targeting~~ Resolved R6-Q8: flat/position-based, not per-player.
~~25. Squad-share export timing~~ Resolved R6-Q9: manually triggered.
~~26. Lobby carryover between back-to-back drafts~~ Resolved R6-Q10: nothing carries
    over, clean slate every time.
~~27. Post-Draft Editing for graveyard-less formats~~ Resolved R8-Q2: Free Pick, Spin the Wheel, and Deal or No Deal squads are permanently locked upon draft completion — no post-draft player changes.
28. AI Bot ML Architecture & Training Specification: Training for Deal or No Deal, Spin the Wheel, and Free Pick is fully complete, and models are exported. Auction training is pending a complete implementation from scratch. (In progress).
~~29. Auction: how many footballers go on the block per draft~~ Resolved 2026-08-19
    (`auction-training`): capped at **15 × lobby size**, drawn position-by-position so
    the coverage rule in item #2 still holds. This amends item #11's definition of "runs
    its course" — exhausting the *lot list*, not the whole scoped pool. Still open: how
    the `4N` surplus lots beyond guaranteed coverage are weighted (the same unresolved
    high-ability skew curve as items #3 and #16).
~~30. How far the room's squads are exposed during a draft~~ Resolved 2026-08-19 when the
    Free Pick draft screen was built: **fully, to everyone, the whole way through.** Every
    drafter's eleven is one tab click away on the pitch — no reveal, no delay, no fog. A
    draft where you cannot read what the others are building has only one strategy in it,
    which is taking the best name left. Amends item #10: comparing squads is a *post*-draft
    screen, but in-draft board reading is not a thing it was ever gating.

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
| 7 | Position reform: full remap to single positions, Multi-Position Eligibility retirement, Auction overflow-to-graveyard mechanic, hard-gate placement, Post-Draft Editing narrowed | Answered |
| 8 | Bot Questionnaire 1: Auction budget formula, Auction bid timer resets, unsold player handling, D-o-N-D banker & boxes, Free Pick deadlock stance, non-auction post-draft lock, position-weighted squad evaluation metric, ML RL training approach, bot live delay | Answered (`bot-questionnaire-1.md`) |
| 9 | Bot Questionnaire 2: Separate models per format, margin-over-average RL reward, Auction +5M/+10M/+25M actions, Deal or No Deal -15 banker discount, pure ML selection policies, randomized 2-5 seats & weighted scopes, in-browser ONNX/JS execution | Answered (`bot-questionnaire-2.md`) |
| 10 | Bot Questionnaire 3: Multi-agent PPO, 500k+ episodes, Champion Checkpoint League evaluation, full pool 546-player embeddings, comprehensive auction/D-o-N-D observations, action masking, softmax temperature ~0.6 | Answered (`bot-questionnaire-3.md`) |

## Project Status

**Front end: complete.** The home page, both lobbies and **all four draft screens — Free Pick,
Spin the Wheel, Deal or No Deal and Auction** — are built and routed: `/`, `/solo/:formatId`,
`/lobby/:code`, `/draft/:formatId`, the last dispatching on the format. Free Pick went through a
simplification pass on 2026-08-20 (a quieter rail, a rebuilt face-anchoring system, no
section numerals); Spin the Wheel was built the same day off the Orbit layout; Deal or No
Deal followed, also 2026-08-20, off the exhibition's picked layout 18; Auction closed the set on
2026-08-21 off layout 01, with the sold record taking layout 09's square cards. All screens sit inside
one app frame with a symmetric inset — left equals right, top equals bottom, on every route —
and have stopped measuring the window themselves — see The app frame, symmetric above, and do
not write `100dvh` or a route-local padding figure again. Every control on every one of
them goes somewhere; there are no dead ends left in the flow. Nothing is wired to Firebase,
so opponents, bots and chat are simulated on screen per the fake-the-functionality rule.

**The two site-wide changes the Auction exhibition stated are live, but on the Auction route
only** — full-colour unfiltered photographs and crests, and the stadium plate at `.72` rather
than `.30–.36`. Rolling either out to the other six screens is a separate pass and has not been
done. See **The Auction draft screen** above.

**Bots:** development is complete for Deal or No Deal, Spin the Wheel and Free Pick; models
are exported to `public/botModels/`. **Auction training has since run** — a real pipeline,
checkpoint and exported policy all now exist; see the 2026-08-20 update at the top of the
handover below for what's verified and what isn't. Every draft screen's bots, including the
new Deal or No Deal one, are simple heuristics local to that screen's own engine file, not
the exported policies; wiring those in is separate work, for all four formats.

Verify the front end with `npm run build` (typecheck + build), `npm test` (Vitest), and
`npm run dev`.

## Project Handover — the Auction bot training run

Carried over from the 2026-08-19 auction-training session. **This is about bot training, not
about the front end.** The front end has repeatedly used its own working document,
`HANDOVER.md` at the repo root, written per-branch for whichever build was in progress and
removed once that build's content was folded into this document — first for the Free Pick
tuning pass (removed 2026-08-20, folded into The Free Pick draft screen above), then again
for the Deal or No Deal build (removed 2026-08-20, folded into The Deal or No Deal draft
screen above). It is not a durable file; this document is. A second, lossier copy of
everything below used to sit underneath this section too; it was deleted on 2026-08-19.

# Project Handover Document

**Last updated:** 2026-08-19 (second update, after the design session), on the `auction-training` branch.

## Current Status

**Update, 2026-08-20 — read this before the rest of the document.** A training run has
completed since this was written: `env_auction.py`, `ppo.py`, `train_auction.py`,
`scripted_auction.py`, `reference_auction.py`, `obs_auction.py` and
`tests/test_auction_env.py` — everything the "Nothing has been implemented yet" line below
says doesn't exist — are in `scripts/training/`, along with a real
`checkpoints/auction/champion.pt` and `metrics/auction_history.json`. These landed in the
repo mixed into an unrelated frontend commit (the Spin the Wheel UI screen), because they
were sitting untracked when that commit was staged with `git add -A` — worth knowing if
you go looking for a dedicated "Auction training" commit and don't find one.

Verified directly against the files, not assumed: **166 logged updates over ~6.6 hours**
(23,707s elapsed), **1,153,433 drafts trained on** — past the spec's 500k floor, under its
12-hour ceiling — `avg_squad_score` climbing from 265 at update 1 to a plateau around 1,508
by roughly update 140 and holding flat through update 166. `src/data/botModels/auction_policy.json`
is weight-for-weight identical to `champion.pt`'s `state_dict` (checked entry by entry), and
its first layer takes **69 inputs**, not the old hardcoded 37 — so it *is* the real trained
export, not the placeholder Landmine 1 below describes, and Landmine 4's dimension mismatch
was already fixed by the time this export was made.

**Not verified:** no scripted-bidder benchmark log exists anywhere in
`scripts/training/metrics/` — the design's own intended yardstick (see "The seven
decisions" → Measurement, below) for telling real skill from self-play noise. A plateaued
self-play score is the only convergence evidence on hand; it is not the same claim as
"beats the scripted bidder by a real margin." Confirm that before treating this as done.

The rest of this document is the 2026-08-19 point-in-time record and is left as written —
read it against the update above, not as still-current on the Auction question.

Reinforcement Learning training is complete for three of the four draft formats:

- **Deal or No Deal**
- **Spin the Wheel**
- **Free Pick**

They were trained with a custom Python PPO implementation and exported as lightweight JSON weights into `src/data/botModels/` for zero‑dependency execution directly in the browser via TypeScript. These three are **final and complete**.

**The Auction format has no trained model.** Building its training pipeline from scratch is the outstanding task.

**The design for that pipeline is now complete and approved.** It lives in `docs/superpowers/specs/2026-08-19-auction-training-pipeline-design.md`. That document is the authority on what to build — this file is context, the spec is the instruction.

The outstanding work is writing an implementation plan from it and then executing it. Nothing has been implemented yet; no code was written in the design session.

## Architecture for the Completed Formats

- **Model Architecture:** simple multi‑layer perceptron (MLP) policies defined in `scripts/training/models.py`.
- **State Representation:** features concatenated into a flat vector (one‑hot positions, player abilities, current squad needs, etc.).
- **Inference:** the frontend performs the matrix multiplications from the exported JSON weights and picks the highest‑probability action.

## What Survives in `scripts/training/`

Only shared infrastructure. Everything format‑specific was wiped.

| File | What it gives you |
|---|---|
| `config.py` | Paths, formation slots, position multipliers, bid increments, PPO hyperparameters, scope weights, and the **Auction lot cap constants** added 2026-08-19. |
| `player_pool.py` | Loads the 546‑player CSV into vectorized arrays. Implements the budget formula, scope masks, `calculate_squad_score`, and `get_optimal_squad_from_roster` (optimal slotting with graveyard overflow). Solid, reusable. |
| `models.py` | Actor‑critic networks for all four formats, including `AuctionPolicyNetwork`. |
| `export_weights.py` | Converts `champion.pt` checkpoints into frontend JSON (and attempts ONNX). |
| `live_config.json` | Mid‑run hyperparameter overrides, read by `config.get_live_config()`. |
| `metrics/`, `static/dashboard.html` | Metrics JSON and a training dashboard. |
| `checkpoints/` | `dond/`, `free_pick/`, `spin_wheel/` only. **No `auction/`.** |

**Wiped, for every format — not just Auction:** `env_*.py`, `ppo.py`, `checkpoint_league.py`, and all four `train_*.py`. There is no working training loop in the repo to imitate. The only trace is `__pycache__/*.pyc`, which can be inspected with `marshal.load` if you want to see what the old code did without running it.

## Forensics on the Failed Auction Run (2026-08-19)

Three days of attempts produced an auction trainer that was slow and would not improve.

Disassembling the wiped `env_auction.cpython-313.pyc` found the cause, and it was a **missing game rule rather than a hyperparameter problem**:

- `reset()` built the lot queue as `list(np.random.permutation(scope_indices))` — the **entire scoped pool**, with nothing capping it. An All Players draft auctioned all **546** footballers; Top 5 auctioned 463.
- `_check_auction_ended()` stopped only when that queue emptied, or when every drafter holding an empty slot had **under 5M** left. It never checked whether they could afford an *eligible* footballer for their open slots — merely that they had 5M to their name.
- Budgets make that second condition almost unreachable. A drafter can complete a legal XI for **220M** out of a **900M** budget, so one drafter sitting on an unfilled thin slot with money left — near‑universal, since GK/LB/RB depth is low and reveal order is random — kept the queue running to the final lot.

The result: every draft was effectively a 546‑lot auction. Each lot is a bidding loop over up to 5 seats, so the floor was roughly **2,730 policy decisions per episode** against Free Pick's 55 — a **50–100× longer episode** carrying a single terminal reward. That is both the throughput problem and the credit‑assignment problem. Most of those steps were noise: bidding on lot 400 when the XI filled at lot 90.

Measured: Auction ran at **4.4–7.0 drafts/sec** and had completed **5,634 drafts** when it was stopped, against 10–15 drafts/sec for the other three formats.

## The Rule That Came Out Of It

**The auction lot list is capped at 15 × lobby size** (settled 2026-08-19). At most `15 × N` footballers go on the block for an `N`‑drafter table: 30 lots at 2 drafters, 75 at 5. This is a **game rule**, not a training shortcut — a 546‑lot auction at a 15s bid timer was never playable by humans either. The training environment inherits it.

The list is built position‑by‑position first (`N` per single‑occupancy slot, `2N` for CB = `11N`), with the remaining `4N` lots drawn from the rest of the scoped pool under the usual high‑ability skew. That preserves the Squad Completion Guarantee by construction: a uniform random draw of `15N` would leave thin positions short about half the time (4.8 LBs and 5.1 RBs on average against 5 needed at a 5‑drafter table).

Constants live in `scripts/training/config.py` as `AUCTION_LOTS_PER_DRAFTER` and `AUCTION_LOTS_PER_POSITION_PER_DRAFTER`. Full rule text is in `PROJECT.md` under Configuration Mechanics → Formats → Auction.

## Environment Facts

- **Use `C:\Users\Mert\AppData\Local\Programs\Python\Python313\python.exe`.** The `python` on the Git Bash PATH is a different interpreter with **no torch installed**.
- Python 3.13.11, torch `2.7.0.dev20250310+cu124`.
- **CUDA is available**: NVIDIA GeForce GTX 1650 Ti (4GB, Turing). Plan for a small GPU — large batches will not fit, and CPU‑side vectorization may beat GPU for tiny MLPs.
- Windows 10. PowerShell and Git Bash both available; they have different Python resolution, as above.

## Landmines

1. **`src/data/botModels/auction_policy.json` is not a trained model.** It is a randomly initialized network. `export_weights.py` silently exports an untrained net when no checkpoint exists, and there is no `checkpoints/auction/`. Do not ship it, and do not read it as evidence that anything worked. **No longer true as of 2026-08-20** — see the Current Status update above: a `checkpoints/auction/` now exists, and the exported JSON is weight-for-weight identical to it.
2. **`metrics/auction_metrics.json` and `auction_status.json` are stale** — leftovers from the wiped run (champion generation 17, 5,634 drafts). Not a baseline. **Moot as of 2026-08-20** — neither file exists in the tree any more; the current run only wrote `metrics/auction_history.json`.
3. **`live_config.json` still carries auction overrides** from the failed run — `lr` 3e-5 (10× lower than the other formats), `c_entropy` 0.06 (the highest), `reward_scale` 0.01. These are symptoms of fighting an unstable run, not tuned starting points. **Moot as of 2026-08-20** — `scripts/training/live_config.json` doesn't exist any more; whatever hyperparameters the 2026-08-20 run actually used aren't recorded anywhere checked.
4. **`AuctionPolicyNetwork` hardcodes `obs_dim=37`**, and `export_weights.py` repeats that 37 in its format table. **Resolved in the spec:** the observation is re‑derived as 69 features with a pinned feature ordering (spec §5). Both hardcoded 37s must be changed to 69. The ordering is a contract with the TypeScript inference path — a silent mismatch there is the most likely way this ships broken. **Confirmed fixed, 2026-08-20** — the exported policy's first layer takes 69 inputs, not 37.
5. **`player_pool.get_scope_mask` does not enforce per‑league drafter caps.** Single‑league scope is 20% of training sampling, but Ligue 1 is unusable at any table size, Bundesliga caps at 2 drafters and First Division at 3 (see PROJECT.md → Player Data). **Resolved in the spec:** league and table size are sampled *jointly* against the viability table in the env's reset (spec §3.2). `get_scope_mask` itself is left alone — do not patch it.
6. **The three "finished" formats never reached the specified volume** — roughly 116k (Free Pick), 126k (Spin the Wheel) and 166k (Deal or No Deal) drafts against the 500k+/format rule in PROJECT.md. **Resolved:** Auction is held to convergence, not to parity with them — hard floor at the spec'd 500k drafts, 12‑hour ceiling, ship the best checkpoint by benchmark margin. Mert accepts that Auction may end up the strongest of the four bots. At the designed throughput the 500k floor costs well under two minutes, so it is not a real constraint.
7. **Untracked junk in the repo root** from the old run: `debug.log`, `error.log`, `training_log.txt`, `sim_output.txt`, `read_metrics.py` (UTF‑16, broken). **Gone as of 2026-08-20** — none of the five exist in the tree any more, and `.gitignore` now actually matches the four log/txt names (it was silently broken — letter-spaced from a bad paste — until this same pass fixed it).

## The Design Session (2026-08-19, after the forensics above)

The pipeline was brainstormed to an approved design. Nothing was implemented. The full document is `docs/superpowers/specs/2026-08-19-auction-training-pipeline-design.md`; this is the summary.

### A third failure mode, not in the forensics above

The forensics blame throughput and credit assignment. There is very likely a third, and it may be why the runs *looked* flat rather than merely being flat:

> Reward is `own score − lobby average`. Under self‑play with one shared policy, `Σᵢ (Sᵢ − mean(S)) = 0` **identically**, every episode, forever. Mean training reward is a constant. It cannot move no matter how strong the bot becomes.

If the previous runs were judged on mean episode reward, "it won't improve" was a reading of a number that is pinned at zero by construction. PPO itself is fine with this — the signal lives in the within‑draft variance and advantages are naturally centred — but a non‑learning frozen opponent is required to measure anything at all. Hence the scripted bidder below.

### The seven decisions

| # | Decision | Choice | Why |
|---|---|---|---|
| 1 | Bid loop | **Simultaneous rounds** | All non‑high‑bidder seats decide at once; highest raise wins, random tie‑break; lot ends on a full round with no raise. Keeps the settled Pass/+5/+10/+25 actions, invents no turn order (the game has none — R2‑Q5), and batches all five seats into one forward pass: ~375 ticks per draft instead of ~1,875. |
| 2 | Reward delivery | **Potential‑based shaping**, γ=1 | Per‑step reward is the change in projected room‑relative margin. Rewards telescope to *exactly* the settled terminal formula, so the objective is provably unchanged (Ng‑Harada‑Russell) while feedback arrives on every lot. Also makes blocking (R5‑Q6) emerge from the reward instead of needing a bonus term. |
| 3 | Measurement | **Scripted bidder**, frozen | Absolute yardstick that self‑play margin cannot provide. Also seeds 12.5% of training seats so early learning faces competent play, and is a shipping fallback. |
| 4 | Queue knowledge | **Past‑facing counts** | Bot sees lots revealed and sold per position, never the remaining queue. An MLP has no memory, so this restores the counting an attentive human does — no more, no less. |
| 5 | Stopping | **Train to convergence** | Floor 500k drafts, 12‑hour ceiling, ship best‑by‑benchmark. See landmine 6 above. |
| 6 | Ability skew | **softmax T=10** | Closes Open Questions #3, #16, #29. ~12 of the pool's top 20 reach a 75‑lot block, and which twelve varies per draft. |
| 7 | Budget multiplier | **×19** | Amends R8‑Q0. |

### Rule amendments this creates

These are **game rules**, not training knobs, and must be written into `PROJECT.md`:

1. **Budget ×20 → ×19** (amends R8‑Q0). Because of the round‑to‑nearest‑100M step this moves only Top 5 Leagues, 900M → 800M. Mert chose 19 after seeing that ×20 is correctly binding at All Players and Top 5 (budget ÷ best‑XI‑on‑the‑block = 0.97) but slack at Serie A (1.42) and Bundesliga (1.57). Nothing simple fixes the thin‑league slack — it comes from top‑end pool depth, not average price. **The frontend budget figure needs the same change, tracked as a follow‑up outside the training work.**
2. **Ability skew = `p ∝ exp((ability − max) / 10)`**, closing Open Questions #3, #16 and #29. Knock‑on: R6‑Q2 makes Deal or No Deal's boxes follow the same skew, and that bot is already final. Judged a mild distribution shift, not a breakage — flagged, not re‑trained.
3. **The first bid on a lot is *at* the opening price**, clarifying R8‑Q4 against R9‑Q3. The three increment actions are therefore redundant in round one and mask down to `{Pass, Bid}`.

### Assumptions resolved without asking

Recorded in spec §13 so they are cheap to overturn: the first‑bid clarification above; backfill contention between two seats wanting the cheapest player resolves in random seat order (the rules do not specify); and the Deal or No Deal skew knock‑on.

## Next Steps

1. **Read the spec.** `docs/superpowers/specs/2026-08-19-auction-training-pipeline-design.md`. It is approved and is the authority. Do not re‑brainstorm it, and do not re‑run the forensics in this file — both cost context and are already settled.
2. **Write an implementation plan from it**, then execute.
3. **Build order that de‑risks fastest:** the slow single‑env reference implementation first, then the batched env, then parity‑test one against the other. A vectorized env fails silently; the reference is the only thing that catches it. The invariant `Σ shaped rewards == terminal margin` is the second‑best guard, since it proves the shaping did not alter the objective.
4. **Benchmark throughput before training anything.** Target ≥2,000 drafts/sec against the old 4.4–7.0. If it is not there, the batching is wrong and no amount of training will help.
5. **Amend `PROJECT.md`** with the three rule changes above.
6. **Clear the junk** listed in landmines 2, 3 and 7.

The two success conditions that matter: throughput ≥2,000 drafts/sec, and the mean margin against the frozen scripted bidder climbing and then plateauing. A flat benchmark curve from the start means the design failed — and the diagnostics in spec §8 (clearing price ÷ opening bid, unspent budget, backfilled slots, action distribution) are there to say which half.

## Git Operations — already carried out

The commands this handover asked for were run on 2026-08-19; `free-pick-ui-static` exists and
carries the work described above. Kept only as a record of what happened.

```bash
git add -A
git commit -m "Remove training scripts and experimental HTML UI; finalize bot development"
git push origin main
git checkout -b free-pick-ui-static
git push -u origin free-pick-ui-static
```
