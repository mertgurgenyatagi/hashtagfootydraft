/** The lobby's backdrop: the same stadium plate as the home page, but full-bleed
 *  rather than a top band, with a vignette so the corners stay dark enough to
 *  hold UI. The photo is the room the lobby is standing in.
 *
 *  `isolate` matters — the tint layer blends in `color` mode and would otherwise
 *  reach past this element and grey out the whole page.
 *
 *  Entirely inert: no hit target, no semantics, painted behind everything. */
export function LobbyBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 isolate overflow-hidden">
      {/* BASE_URL, not a leading slash: Vite's base is './' so the build has to
          survive being served from a GitHub Pages project subpath. */}
      <img
        src={`${import.meta.env.BASE_URL}stadium.webp`}
        alt=""
        decoding="async"
        fetchPriority="high"
        className="h-full w-full scale-105 object-cover object-[50%_44%] [filter:grayscale(1)_contrast(1.15)_brightness(0.32)]"
      />
      <div className="backdrop-tint absolute inset-0" />

      {/* Darkest at the edges, where every panel sits. Held off pure black in the
          middle so the stands stay visible behind the format cards. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(16_22_19/0.42)_0%,rgb(16_22_19/0.92)_100%)]" />
    </div>
  )
}
