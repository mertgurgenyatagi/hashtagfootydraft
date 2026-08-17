# Handover — 2026-08-17 (refresh)

Short note for whoever picks this up in a fresh session. `PROJECT.md` is the source of
truth for the game rules and the frontend; this file only covers *where things stand
right now*.

## State

- **Branch:** `main` (merged from `frontend-retry`).
- **The home page is the entire site.** No lobby, no router, no second route. Every
  control is an honest dead end that says so in the status line.
- `npm run build` and `npm test` both pass. Verified in a browser.
- **Recent pass (2026-08-17, Tachyon mode):**
  - Wordmark now cycles player faces directly in the letterforms (grayscale, tiled,
    cross-fading every 3.8s), replacing the separate portrait carousel.
  - Background drift is much faster (54s → 20s) and more perceptible (four keyframe
    stages instead of two).
  - Hover transitions on format tiles and action bar buttons snappied from 300ms to 100ms;
    format hovers now pure CSS, not stateful React.
  - Format descriptions removed: `MessageRow` is now static "Play with friends" title,
    `Format.blurb` deleted.
  - Background drift replaced outright: instead of a 4-stage 20s scale-and-translate
    loop, the plate now does one slow, linear 30s zoom (1.26× → 1.32×) anchored below
    centre (`transform-origin: 50% 75%`), fading to invisible and back at the loop
    boundary so the reset to frame one crossfades rather than jumps.
  - Wordmark face fill switched from a tiled repeating pattern to a single
    `background-size: cover` image per carousel instance — no more grid-of-faces look.
  - A short "Draft. Argue. Repeat." blurb now sits to the right of FOOTY, in the space
    the old portrait carousel used to occupy.

## Four rules that are now project-wide

Set explicitly by Mert, settled — don't reopen them:

1. **No I-beam** except in boxes you type into. Buttons take `pointer` across their
   *entire* span, label text included.
2. **Motion everywhere, small.** Initialisation sequence on load, ambient movement that
   never stops, a transition on every state change. Compositor-only, nothing bouncing.
3. **Only Oswald and Inter** — logos excepted. Bebas Neue is on the wordmark on that
   basis and nowhere else.
4. **Petrol is the palette.** Four primes, everything else derived by `color-mix`.

`PROJECT.md` → Design tokens / Typography / Interaction rules carries the detail.

## Where things live

- `src/routes/Home.tsx` owns the status state; the five components are in
  `src/components/home/`.
- `Wordmark.tsx` cycles through the faces in `wallFaces.ts` every 3.8s, tiling them
  grayscale into the letterforms via `background-clip: text`.
- `src/styles/index.css` holds the four primes, the derivation block, the cursor rules
  and every keyframe. **`@theme static`**, not plain `@theme` — Tailwind prunes theme
  variables no utility references, and most of the derived tokens are read by
  hand-written CSS.
- `scripts/make_face_crops.py` cuts `public/faces/` from `face_coordinates.json` — 4:5
  portraits with the face at a fixed 42% of the crop's height, ~10 KB each.
  `src/data/wallFaces.ts` names which ones cycle through the wordmark.

## Gotchas worth not rediscovering

- **The wordmark face fill is a single `cover` image now, not tiled.** An earlier pass
  tiled the face at ~native resolution (`background-size: auto 48%` + `repeat`) because
  `cover` crushed the portrait crop to near-black across the wide two-line box. That was
  deliberately reversed 2026-08-17 — one image per carousel instance is what's wanted. If
  the crushed-black problem resurfaces, that's why tiling existed the first time.
- **Stacking order is load-bearing.** `<main>` is `z-20` and the bottom block `z-10`, not
  the other way round.
- **Player photo slugs are full names.** `public/players/erling-haaland.webp`, not
  `haaland`. Short slugs 404.
- **Playwright MCP refuses `file:` URLs.** To smoke-test a mockup, serve the repo root:
  `python -m http.server 8900 --bind 127.0.0.1`. A browser opens the file fine.
- **Asset paths in `src/` go through `import.meta.env.BASE_URL`**, never a leading slash
  — GitHub Pages serves from a subpath.

## Next

The **single-player lobby** is the obvious next build — all four format tiles point at
it. Then the friends lobby behind Create / Join, which is when `HashRouter` comes back
(`react-router-dom` is still installed and unimported for exactly that).

Hallmark note: `.hallmark/log.json` now has two entries. The exhibition consumed 20 of
the 21 macrostructures and the home page re-used Type Specimen at different knob values,
so a genuinely new page here means Feature Stack (needs scroll — this app never does) or
another deliberate re-use at different knobs.
