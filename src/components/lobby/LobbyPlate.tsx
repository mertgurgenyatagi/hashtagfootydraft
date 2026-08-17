/**
 * The same photograph the home page runs full bleed, cornered into the bottom
 * right of the settings half instead. It keeps drifting on the shared 30s loop
 * so this screen is never a still image either.
 *
 * `import.meta.env.BASE_URL`, never a leading slash — the build ships to a
 * GitHub Pages project subpath.
 */
export function LobbyPlate() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="plate-corner fx fx-plate absolute bottom-[-12%] right-[-8%] h-[86%] w-[96%]">
        <img
          src={`${import.meta.env.BASE_URL}stadium.webp`}
          alt=""
          className="plate-drift h-full w-full object-cover object-[50%_28%]"
          draggable={false}
        />
        <div className="plate-tint absolute inset-0" />
      </div>
    </div>
  )
}
