/** The hash is the only gold glyph on the screen at rest — it ties the accent
 *  colour to the brand mark rather than to decoration. */
export function Wordmark() {
  return (
    <h1 className="font-display text-[clamp(3rem,10vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.02em]">
      <span className="text-accent">#</span>footydraft
    </h1>
  )
}
