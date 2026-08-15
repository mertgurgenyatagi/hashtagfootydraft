/** The home screen's backdrop, in two bands.
 *
 *  Top ~42% is a monochrome stadium plate, zoomed past both edges and tinted to
 *  the ground colour so it reads as the background rather than a photo dropped
 *  onto it. It dissolves at the bottom into the 64px line grid lifted from
 *  #irishtable (`frontend_inspo.md` §1.4), which carries the rest of the page.
 *
 *  Entirely inert: no hit target, no semantics, painted behind everything. */
export function StadiumBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="backdrop-photo absolute inset-x-0 top-0 h-[42dvh] overflow-hidden">
        {/* BASE_URL, not a leading slash: Vite's base is './' so the build has to
            survive being served from a GitHub Pages project subpath. */}
        <img
          src={`${import.meta.env.BASE_URL}stadium.webp`}
          alt=""
          decoding="async"
          fetchPriority="high"
          className="h-full w-full origin-center scale-[1.18] object-cover object-[50%_46%]"
        />
        <div className="backdrop-tint absolute inset-0" />
      </div>

      <div className="backdrop-grid absolute inset-0" />
    </div>
  )
}
