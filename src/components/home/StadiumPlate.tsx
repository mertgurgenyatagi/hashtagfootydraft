/**
 * Inert backdrop, painted behind everything: the stadium photograph fading
 * downward into the ground colour, drifting on a 54-second loop so the page is
 * never a still image.
 *
 * `import.meta.env.BASE_URL`, never a leading slash — the build ships to a
 * GitHub Pages project subpath.
 */
export function StadiumPlate() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="plate fx fx-plate absolute inset-0">
        {/* Scaled past the frame by the drift keyframes, so the pitch and its
            corner flag stay below the fold at both ends of the loop. */}
        <img
          src={`${import.meta.env.BASE_URL}stadium.webp`}
          alt=""
          className="plate-drift h-full w-full object-cover object-[50%_0%]"
          draggable={false}
        />
        <div className="plate-tint absolute inset-0" />
      </div>
    </div>
  )
}
