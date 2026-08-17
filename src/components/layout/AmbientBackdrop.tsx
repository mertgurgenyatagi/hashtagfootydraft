import { useLocation } from 'react-router-dom'

/**
 * Persistent ambient stadium backdrop.
 *
 * Hoisted to the root AppShell so the 30-second ambient scale/drift animation
 * is continuous across page navigation rather than restarting on every route change.
 *
 * Transitions between full-bleed mode (Home) and corner-anchored mode (Lobby diptych).
 */
export function AmbientBackdrop() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Home full-bleed plate layer */}
      <div
        className={`plate fx fx-plate absolute inset-0 transition-opacity duration-500 ease-out ${
          isHome ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <img
          src={`${import.meta.env.BASE_URL}stadium.webp`}
          alt=""
          className="plate-drift h-full w-full object-cover object-[50%_0%]"
          draggable={false}
        />
        <div className="plate-tint absolute inset-0" />
      </div>

      {/* Lobby corner-anchored plate layer (anchored to the right half on desktop) */}
      <div
        className={`absolute inset-y-0 right-0 w-full transition-opacity duration-500 ease-out md:w-1/2 ${
          !isHome ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="plate-corner absolute bottom-[-12%] right-[-8%] h-[86%] w-[96%]">
          <img
            src={`${import.meta.env.BASE_URL}stadium.webp`}
            alt=""
            className="plate-drift h-full w-full object-cover object-[50%_28%]"
            draggable={false}
          />
          <div className="plate-tint absolute inset-0" />
        </div>
      </div>
    </div>
  )
}
