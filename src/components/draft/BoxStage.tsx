import { useEffect, useState } from 'react'
import { faceCenters } from '../../data/faceAnchors'
import { type Player, slugify } from '../../lib/players'

/** Same fallback the other two photo surfaces use for an unmarked face box. */
const DEFAULT_CENTER: [number, number, number, number] = [0.5, 0.35, 0.8, 0.2]

export interface Decision {
  label: string
  onChoose: () => void
  /** The accent-filled one. Exactly one of a pair is ever primary. */
  primary?: boolean
}

interface BoxStageProps {
  player: Player
  /** `Box 03 · Priya`, or `The banker offers`. Sits over the name. */
  label: string
  /** Draws the label and the frame in accent — the banker, and your own box. */
  accent?: boolean
  /** Docked across the bottom. Empty while a reveal is only being watched. */
  decisions?: Decision[]
  /** Shown small under the buttons: why they are disabled, or what is at stake. */
  note?: string | null
}

/**
 * Centre stage. A box coming open is the whole event in this format, so it gets
 * the largest surface on the screen rather than a card in a grid — the
 * footballer arrives full-bleed, lit, over the room dropped back behind them.
 *
 * The banker's offer is drawn on exactly this surface at exactly this size.
 * That is the point of it: a deal you are being asked to weigh against a box
 * has to be presented at the same weight as the box, or the comparison the
 * format is built on is made for you by the layout.
 *
 * When there is something to decide, the decision docks along the bottom of
 * the photograph rather than opening somewhere else, so the face and the
 * choice are never in two different places.
 */
export function BoxStage({ player, label, accent = false, decisions = [], note }: BoxStageProps) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [player.id])

  const [fx, fy, ar, fh] = faceCenters[slugify(player.name)] ?? DEFAULT_CENTER

  return (
    <div
      className={[
        'spotlight-frame fx fx-soft absolute inset-0 overflow-hidden border bg-surface-2',
        accent ? 'border-accent-line' : 'border-line-strong',
      ].join(' ')}
    >
      {failed ? (
        <img
          className="crest absolute left-1/2 top-1/2 h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 opacity-40"
          src={player.crest}
          alt=""
        />
      ) : (
        <img
          key={player.id}
          className="spotlight-photo dond-stage-photo fx fx-fade"
          style={
            {
              '--face-fx': fx,
              '--face-fy': fy,
              '--face-ar': ar,
              '--face-fh': fh,
              animationDuration: '460ms',
            } as React.CSSProperties
          }
          src={player.portrait}
          alt={player.name}
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}

      <div className="dond-stage-caption absolute inset-x-0 bottom-0 flex flex-col gap-[clamp(8px,1.5cqh,14px)] p-[clamp(14px,2.4cqh,22px)] pt-[clamp(40px,10cqh,80px)]">
        <span
          className={[
            'font-display text-[10px] font-medium uppercase tracking-[0.24em]',
            accent ? 'text-accent' : 'text-muted',
          ].join(' ')}
        >
          {label}
        </span>

        <span className="dond-stage-name font-display font-medium uppercase leading-[0.92] text-ink">
          {player.name}
        </span>

        <span className="flex flex-wrap items-center gap-[10px]">
          <img className="crest h-[19px] w-[19px] shrink-0" src={player.crest} alt="" />
          <span className="truncate text-[12.5px] leading-none text-muted">
            {player.club} · {player.nation} · {player.age}
          </span>
          <span className="font-display text-[12.5px] font-medium uppercase leading-none tracking-[0.1em] text-dim">
            {player.position}
          </span>
        </span>

        {decisions.length > 0 ? (
          <div className="mt-[clamp(2px,1cqh,8px)] flex flex-wrap items-center gap-[clamp(8px,1.6cqh,16px)]">
            {decisions.map((decision) => (
              <button
                key={decision.label}
                type="button"
                onClick={decision.onChoose}
                className={[
                  'dond-decision rounded-[2px] border-2 font-display font-semibold uppercase transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px',
                  decision.primary
                    ? 'border-accent bg-accent text-accent-ink hover:bg-transparent hover:text-accent'
                    : 'border-line-strong bg-ground/70 text-ink hover:border-ink',
                ].join(' ')}
              >
                {decision.label}
              </button>
            ))}
          </div>
        ) : null}

        {note ? <p className="truncate text-[11px] leading-[1.4] text-dim">{note}</p> : null}
      </div>
    </div>
  )
}
