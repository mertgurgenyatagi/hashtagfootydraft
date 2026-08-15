/**
 * Stand-in art for players whose real image hasn't been added yet.
 *
 * Real assets will live at /players/{slug}.webp. Until they do, PlayerImage
 * falls through to this on load error, so the page reads correctly now and
 * dropping real files into public/ later needs no code change.
 *
 * Deliberately font-independent — an SVG in an <img> can't use the page's
 * webfonts, so the only glyphs here are a ghosted number in a stack that
 * exists everywhere.
 */
export function placeholderImage(number: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 180" role="presentation">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1d2a22"/>
      <stop offset="1" stop-color="#0b110e"/>
    </linearGradient>
  </defs>
  <rect width="390" height="180" fill="url(#g)"/>
  <g fill="none" stroke="#2a342c" stroke-width="1.5" opacity="0.85">
    <circle cx="195" cy="90" r="52"/>
    <path d="M195 0 V180"/>
    <path d="M0 8 H390 M0 172 H390"/>
  </g>
  <text x="195" y="132" text-anchor="middle"
        font-family="'Arial Narrow', Arial, Helvetica, sans-serif"
        font-size="126" font-weight="700"
        fill="#ecefe8" fill-opacity="0.08">${number}</text>
</svg>`

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
