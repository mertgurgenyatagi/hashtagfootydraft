# #footydraft — Home Page Design

**Date:** 2026-08-15
**Scope:** The home page only. Frontend-only — no Firebase, no Firestore, no bot AI.
**Branch:** `frontend`

Sources: `PROJECT.md` (game rules), `frontend_inspo.md` (visual + backend patterns),
and the dark palette of the "The 27 Ledger" artifact.

---

## 1. Decisions

| Question | Decision |
|---|---|
| Home page's job | Hybrid — brand hero *and* launch surface in one viewport |
| Stack | Vite + React 19 + TypeScript + Tailwind v4 |
| Identity | Guest nickname field on the home page (no accounts, no auth) |
| Site chrome | None — full-bleed single screen, wordmark is part of the hero |
| Composition | Centred stack + scrolling player marquee band at the bottom |
| Palette | The 27 Ledger's dark theme (see §2) |
| Typography | Oswald + Inter only — no third family, no mono |
| Build scope | Self-contained: HashRouter installed, only `/` built |

## 2. Design tokens

Lifted verbatim from the Ledger's dark theme, with roles reassigned for this app.

| Token | Value | Role |
|---|---|---|
| `--color-ground` | `#101613` | page ground — near-black, green next to true black |
| `--color-surface` | `#182019` | cards, panels, the entry field |
| `--color-line` | `#2a342c` | hairline borders |
| `--color-ink` | `#ecefe8` | primary text — off-white, faintly green |
| `--color-muted` | `#93a599` | secondary text — sage, not grey |
| `--color-accent` | `#d9a54a` | gold — primary CTA fill, the `#` glyph, focus rings |
| `--color-accent-ink` | `#1b1204` | text on gold |
| `--color-live` | `#6cc397` | mint — reserved for "secured" states (unused on this page) |

Rules that outlive this page:

- **Exactly one saturated accent.** Gold. Mint is functional-only and never decorative.
- **No glow.** No `box-shadow` used as a halo, no coloured blur. Depth comes from an
  offset directional shadow or from a flat surface step, never from a bloom.
- **Off-white, never `#fff`.** `--color-ink` everywhere pure white would be reached for.

## 3. Typography

- **Oswald** — wordmark, buttons, labels, and later: bid amounts, countdowns, position
  codes. Condensed, mostly uppercase, weights 400–600.
- **Inter** — body copy, the nickname field, helper and status text.

No third family. Numbers use Oswald with `font-variant-numeric: tabular-nums`, so
ticking countdowns will not jitter.

## 4. Layout

Full-bleed `100dvh` with `overflow: hidden` on the root — the page can never scroll.
A two-row CSS grid:

```
grid-template-rows: 1fr auto;
  row 1  centred stack (wordmark, tagline, entry cluster)
  row 2  player marquee band, pinned to the bottom edge
```

All display type is sized with `clamp()`, so a short viewport compresses the type
rather than overflowing it. Below ~600px of viewport height (landscape phone) the
marquee band is removed and the stack recentres.

Responsive: ≥1024px as designed; <640px the buttons stack full-width and the marquee
cards narrow. The marquee survives on mobile — it is the only imagery on the page.

## 5. Components

```
src/
  main.tsx                    HashRouter root
  App.tsx                     route table — only "/" exists
  styles/index.css            Tailwind import, @theme tokens, base layer
  routes/Home.tsx             composes the screen, owns all state
  components/home/            Wordmark, EntryPanel, JoinCodePanel, PlayerMarquee
  components/ui/              Button, PlayerImage
  data/heroPlayers.ts         marquee entries, drawn from player_data.csv
  lib/placeholderImage.ts     generated SVG stand-in for missing art
```

**State:** three `useState`s in `Home.tsx` (`name`, `joinOpen`, `joinCode`) plus a
status line. No global store — per `frontend_inspo.md` §2.2, state lives next to the
thing that needs it. The nickname persists to `localStorage` so a return visit is
pre-filled.

## 6. Placeholder assets

Real art does not exist yet. Every image points at its eventual path
(`/players/{slug}.webp`, `/clubs/{slug}.svg`) and falls through on error to a
generated SVG stand-in — a tinted field with a ghosted squad number, font-independent
so it renders identically everywhere. Dropping real files into `public/` later is a
zero-code change.

## 7. Motion

Small, purposeful, compositor-only. Nothing uses per-frame JavaScript, so none of it
will contend with real-time updates when Firestore listeners arrive.

- Mount: wordmark → tagline → field → buttons fade and rise 8px, staggered 60ms.
- Marquee: `translate3d` loop, ~60s per cycle, duplicated track for a seamless wrap.
  Pauses on hover.
- Marquee card hover: the green veil pulls back so that player alone comes to full
  colour; the card lifts 4px. Neighbours stay dimmed.
- Gold pill hover: darkens ~6% and lifts 1px; presses flat on `:active`. 120ms.
- Ghost button hover: border brightens, the arrow glyph slides 3px right.
- Join panel: `grid-template-rows: 0fr → 1fr` over 200ms, then autofocus. No height
  measuring in JS.
- Focus: 2px gold ring at 2px offset, `:focus-visible` only.
- The nickname field changes *border colour* on focus. No `box-shadow`, no glow.

Everything above is disabled under `prefers-reduced-motion: reduce`.

## 8. Cursor policy

An I-beam must never appear over non-editable text.

```css
*, *::before, *::after { cursor: default; }
a, button, [role="button"], label, summary { cursor: pointer; }
input, textarea { cursor: text; }
```

Paired with `user-select: none` on the document and `user-select: text` on inputs —
dragging across the wordmark is what usually makes an I-beam appear. The nickname
input keeps `cursor: text` because it genuinely is a text field.

## 9. Honest dead ends

Nothing on this page pretends to work.

- Create Lobby / Play solo are disabled until the nickname is ≥2 characters, with a
  `--muted` helper line stating why — not a dead grey button with no explanation.
- Once enabled, they resolve to a plain inline status line ("lobby screen not built
  yet"), announced via `aria-live`. No fake spinner, no fake progress.
- Join code accepts 6 characters, auto-uppercased; submit is gated on length.

## 10. Verification

- One Vitest + RTL smoke test: renders, CTA gating on nickname length, join panel
  opens. Not a suite — this is a look-and-feel pass.
- One Playwright pass at 1536×864 and 390×844 confirming no scrollbar appears at
  either size and the layout holds.

## 11. Deliberately out of scope

Firebase wiring, bot decision logic, lobby/draft/auction screens, the squad-share
image exporter, real art assets, and accessibility beyond focus-visible, `aria-live`
and reduced-motion.
