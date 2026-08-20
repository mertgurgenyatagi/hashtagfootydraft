import { useLocation } from 'react-router-dom'

/**
 * Persistent ambient stadium backdrop.
 *
 * Hoisted to the root AppShell so the 30-second ambient scale/drift animation
 * is continuous across page navigation rather than restarting on every route change.
 *
 * Four placements of one photograph: full bleed on Home, cornered into the
 * settings half in a lobby, pulled to the left edge on the Free Pick draft —
 * where the right of the screen is a pitch, and a photograph behind pitch
 * markings is two drawings fighting over the same pixels — and masked to a
 * soft ellipse behind the orbit on Spin the Wheel, whose left edge is the
 * wheel and so has no empty band to give away.
 *
 * Each placement's own opacity lives in `index.css`, on an unlayered rule that
 * outranks any Tailwind utility no matter what order they are written in. So
 * the route switch below goes on a *wrapper* rather than on the plate itself —
 * put `opacity-0` on the same element and it loses to `.plate { opacity: .36 }`
 * silently, and every route renders every plate at once.
 */
export function AmbientBackdrop() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSpin = location.pathname.startsWith('/draft/spin-the-wheel')
  const isDraft = location.pathname.startsWith('/draft') && !isSpin
  const isLobby = !isHome && !isDraft && !isSpin

  const shown = (visible: boolean) =>
    `absolute inset-0 transition-opacity duration-500 ease-out ${
      visible ? 'opacity-100' : 'pointer-events-none opacity-0'
    }`

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Home: full bleed. */}
      <div className={shown(isHome)}>
        <div className="plate fx fx-plate absolute inset-0">
          <img
            src={`${import.meta.env.BASE_URL}stadium.webp`}
            alt=""
            className="plate-drift h-full w-full object-cover object-[50%_0%]"
            draggable={false}
          />
          <div className="plate-tint absolute inset-0" />
        </div>
      </div>

      {/* Lobby: cornered into the settings half. */}
      <div className={shown(isLobby)}>
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2">
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

      {/* Spin the Wheel: behind the whole orbit, masked to an ellipse a little
          above centre so the wheel stands in front of a stand. */}
      <div className={shown(isSpin)}>
        <div className="plate-orbit absolute inset-0">
          <img
            src={`${import.meta.env.BASE_URL}stadium.webp`}
            alt=""
            className="plate-drift h-full w-full object-cover object-[50%_38%]"
            draggable={false}
          />
          <div className="plate-tint absolute inset-0" />
        </div>
      </div>

      {/* Free Pick: a narrow band down the left edge, well under the reading
          weight of anything in front of it. */}
      <div className={shown(isDraft)}>
        <div className="plate-edge absolute inset-y-0 left-0 w-[30%] max-w-[360px]">
          <img
            src={`${import.meta.env.BASE_URL}stadium.webp`}
            alt=""
            className="plate-drift h-full w-full object-cover object-[62%_34%]"
            draggable={false}
          />
          <div className="plate-tint absolute inset-0" />
        </div>
      </div>
    </div>
  )
}
