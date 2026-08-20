import type { Drafter } from '../../lib/draftEngine'
import { SectionLabel } from '../ui/SectionLabel'

interface TurnIndicatorProps {
  drafters: Drafter[]
  /** Whose turn it is. Carried by the accent on the disc, not by a word. */
  active: number
  /** Which way the snake is running this round, for the connectors. */
  reversed: boolean
  /** Null when the lobby turned the clock off, and while the wheel spins. */
  seconds: number | null
  /** The full length of a turn, so the drain bar knows how far it has to go. */
  limit: number | null
  /** Restarts the drain. Changes once per pick and never within one. */
  turn: number
  running: boolean
  yourTurn: boolean
}

/**
 * Who is at the table, who is on the clock, and how much of it is left.
 *
 * The seats are the same connected discs the Free Pick screen puts in its top
 * bar, given room to be read at a glance — the connectors carry the snake's
 * direction, which is the one thing about a draft order that is not obvious
 * from looking at it.
 *
 * The clock is a hairline draining along the bottom rather than a number,
 * except on your own turn, where the number is the whole point. A countdown
 * ticking in the corner of the eye of somebody who cannot act on it is just
 * something moving.
 */
export function TurnIndicator({
  drafters,
  active,
  reversed,
  seconds,
  limit,
  turn,
  running,
  yourTurn,
}: TurnIndicatorProps) {
  return (
    <section className="spin-panel relative flex min-h-0 flex-1 flex-col overflow-hidden p-[14px]">
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <SectionLabel>Table</SectionLabel>
        {yourTurn && seconds !== null ? (
          <span className="tabular font-display text-[length:var(--spin-seconds)] font-medium leading-none text-accent">
            {String(Math.ceil(seconds)).padStart(2, '0')}
          </span>
        ) : (
          <span className="truncate font-display text-[10.5px] font-medium uppercase tracking-[0.14em] text-dim">
            {reversed ? 'Order reversed' : 'Order as drawn'}
          </span>
        )}
      </div>

      <ul className="mt-auto flex shrink-0 items-start justify-center pt-[12px]">
        {drafters.map((drafter, index) => (
          <li key={drafter.id} className="flex items-start">
            {index > 0 ? (
              <span
                aria-hidden="true"
                className="mt-[calc(var(--spin-seat)/2)] block h-px w-[clamp(10px,1.6vw,26px)] shrink-0 bg-line-strong"
              />
            ) : null}

            <div className="flex w-[calc(var(--spin-seat)+22px)] flex-col items-center gap-[7px]">
              <span
                className={[
                  'grid h-[var(--spin-seat)] w-[var(--spin-seat)] place-items-center rounded-full font-display text-[13px] font-medium transition-colors duration-300 ease-out',
                  index === active
                    ? 'bg-accent text-accent-ink'
                    : drafter.kind === 'bot'
                      ? 'border border-line-strong text-dim'
                      : 'border border-line-strong bg-surface-2 text-muted',
                ].join(' ')}
              >
                {drafter.mark}
              </span>
              <span
                className={[
                  'w-full truncate text-center font-display text-[9px] font-medium uppercase leading-none tracking-[0.12em] transition-colors duration-300 ease-out',
                  index === active ? 'text-ink' : 'text-dim',
                ].join(' ')}
              >
                {drafter.name}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {limit !== null && running ? (
        <span
          key={turn}
          aria-hidden="true"
          className="turn-drain"
          style={{ animationDuration: `${limit}s` }}
        />
      ) : null}
    </section>
  )
}
