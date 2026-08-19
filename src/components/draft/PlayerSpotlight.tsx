import { useEffect, useState } from 'react'
import { faceCenters } from '../../data/faceAnchors'
import { type Player, slugify } from '../../lib/players'

interface PlayerSpotlightProps {
  /** Whoever is selected. Only loads on selection — not on hover. */
  player: Player | null
  onDraft: () => void
  canDraft: boolean
  reason: string
  actionLabel: string
}

/**
 * The panel beside the pool: one footballer's photograph, with the draft
 * action docked over the bottom of it rather than sitting in a bar of its
 * own beneath the list.
 *
 * Sizing and placement are handled entirely by the `.spotlight-photo` CSS
 * rule in index.css, driven by four custom properties set here from
 * `faceCenters` — see that rule for the actual scale-and-clamp formula.
 */
// Fallback for the rare player with a photo but no marked face box —
// dead centre, standard portrait aspect, mid-range face size, better than
// crashing on a lookup miss.
const DEFAULT_CENTER: [number, number, number, number] = [0.5, 0.35, 0.8, 0.2]

export function PlayerSpotlight({ player, onDraft, canDraft, reason, actionLabel }: PlayerSpotlightProps) {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [player?.id])

  const [fx, fy, ar, fh] = player ? (faceCenters[slugify(player.name)] ?? DEFAULT_CENTER) : DEFAULT_CENTER

  return (
    <div className="spotlight-frame relative hidden w-[var(--draft-portrait)] shrink-0 overflow-hidden border border-line bg-surface lg:block">
      {player && !failed ? (
        <img
          key={player.id}
          className="spotlight-photo fx fx-fade"
          style={
            {
              '--face-fx': fx,
              '--face-fy': fy,
              '--face-ar': ar,
              '--face-fh': fh,
              animationDuration: '320ms',
            } as React.CSSProperties
          }
          src={player.portrait}
          alt={player.name}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : player ? (
        // No photograph on file. The badge stands in rather than the panel
        // collapsing and taking the column width with it.
        <img
          key={`${player.id}-crest`}
          className="crest fx fx-fade absolute left-1/2 top-1/2 h-[46px] w-[46px] -translate-x-1/2 -translate-y-1/2 opacity-40"
          src={player.crest}
          alt=""
        />
      ) : null}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-[8px] bg-gradient-to-t from-ground via-ground/75 to-transparent p-[14px] pt-[40px]">
        <p className="truncate text-[10.5px] leading-[1.4] text-dim">{reason}</p>
        <button
          type="button"
          onClick={onDraft}
          disabled={!canDraft}
          className="w-full shrink-0 rounded-[2px] border border-accent bg-accent px-[16px] py-[10px] font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-accent-ink transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-transparent hover:text-accent active:translate-y-px disabled:pointer-events-none disabled:border-line disabled:bg-transparent disabled:text-faint"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
