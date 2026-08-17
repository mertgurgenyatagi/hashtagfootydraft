import { MAX_SEATS, MIN_SEATS } from '../../data/lobbyOptions'

interface SeatListProps {
  /** Stable ids, so adding a seat animates only the seat that arrived. */
  bots: number[]
  seats: number
  onAdd: () => void
  onRemove: (id: number) => void
}

const DISC = 'grid place-items-center rounded-full font-display font-medium'

/**
 * The table. Five seats at most, filled by hand — the empty one stays on
 * screen, which is the whole reason the left half is a list of seats rather
 * than a number.
 *
 * Bots get an outlined ring with a number, never a player photograph: a face
 * would imply the bot is somebody.
 *
 * Two renderings of the same state. Ruled rows from `md` up; below it the
 * seats compress to a strip of discs with add and remove on the end, because
 * the rows and their captions cannot fit a short viewport that also has to
 * hold the settings half.
 */
export function SeatList({ bots, seats, onAdd, onRemove }: SeatListProps) {
  const canAdd = seats < MAX_SEATS
  const canRemove = seats > MIN_SEATS

  return (
    <>
      {/* ---- Compact: one row — the seats, then the count that labels them. ---- */}
      <div
        className="fx fx-soft flex items-center gap-[6px] md:hidden"
        style={{ animationDelay: '220ms' }}
      >
        <span className={`${DISC} h-8 w-8 shrink-0 bg-accent text-[12px] text-accent-ink`}>Y</span>

        {bots.map((id, index) => (
          <span
            key={id}
            className={`${DISC} h-8 w-8 shrink-0 border border-line-strong text-[11px] text-muted`}
          >
            {index + 1}
          </span>
        ))}

        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          aria-label="Add a bot"
          className={`${DISC} h-8 w-8 shrink-0 border border-dashed border-line-strong text-[14px] text-dim transition-colors duration-150 ease-out hover:border-accent-line hover:text-accent disabled:border-line disabled:text-faint disabled:hover:border-line disabled:hover:text-faint`}
        >
          +
        </button>
        <button
          type="button"
          onClick={() => onRemove(bots[bots.length - 1])}
          disabled={!canRemove}
          aria-label="Remove a bot"
          className={`${DISC} h-8 w-8 shrink-0 border border-line-strong text-[14px] text-dim transition-colors duration-150 ease-out hover:border-ink hover:text-ink disabled:border-line disabled:text-faint disabled:hover:border-line disabled:hover:text-faint`}
        >
          −
        </button>

        <span className="tabular ml-auto shrink-0 font-display text-[10px] font-medium uppercase tracking-[0.1em] text-dim">
          {seats} / {MAX_SEATS}
        </span>
      </div>

      {/* ---- Full: ruled rows. ---- */}
      <ul className="mt-[clamp(1rem,2.6vh,1.625rem)] hidden flex-col border-y border-line-strong [&>li:last-child]:border-b-0 md:flex">
        <li
          className="fx fx-soft flex items-center justify-between gap-3 border-b border-line py-[clamp(0.6rem,1.8vh,1rem)]"
          style={{ animationDelay: '220ms' }}
        >
          <div className="flex items-center gap-[14px]">
            <span className={`${DISC} h-[38px] w-[38px] shrink-0 bg-accent text-[14px] text-accent-ink`}>
              Y
            </span>
            <span className="flex flex-col gap-[3px]">
              <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.02em]">
                You
              </span>
              <span className="text-[11px] text-dim">Host — sets the draft on the right</span>
            </span>
          </div>
          <span className="shrink-0 rounded-[2px] border border-accent-line px-2 py-1 font-display text-[9.5px] font-medium uppercase tracking-[0.16em] text-accent">
            Seat 1
          </span>
        </li>

        {bots.map((id, index) => (
          <li
            key={id}
            className="fx fx-soft flex items-center justify-between gap-3 border-b border-line py-[clamp(0.6rem,1.8vh,1rem)]"
            style={{ animationDelay: `${280 + index * 60}ms` }}
          >
            <div className="flex items-center gap-[14px]">
              <span
                className={`${DISC} h-[38px] w-[38px] shrink-0 border border-line-strong text-[13px] text-muted`}
              >
                {index + 1}
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.02em]">
                  Bot {index + 1}
                </span>
                <span className="text-[11px] text-dim">Default style</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(id)}
              disabled={!canRemove}
              className="shrink-0 font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted transition-colors duration-150 ease-out hover:text-ink disabled:text-faint disabled:hover:text-faint"
            >
              Remove
            </button>
          </li>
        ))}

        {canAdd ? (
          <li className="fx fx-soft" style={{ animationDelay: `${280 + bots.length * 60}ms` }}>
            <button
              type="button"
              onClick={onAdd}
              className="group/seat flex w-full items-center gap-[14px] py-[clamp(0.6rem,1.8vh,1rem)] text-left"
            >
              <span
                className={`${DISC} h-[38px] w-[38px] shrink-0 border border-dashed border-line-strong text-[15px] text-dim transition-colors duration-150 ease-out group-hover/seat:border-accent-line group-hover/seat:text-accent`}
              >
                +
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="font-display text-[17px] font-bold uppercase leading-none tracking-[0.02em] text-dim transition-colors duration-150 ease-out group-hover/seat:text-ink">
                  Add a bot
                </span>
                <span className="text-[11px] text-faint">
                  {MAX_SEATS - seats === 1 ? 'One seat left' : `${MAX_SEATS - seats} seats left`}
                </span>
              </span>
            </button>
          </li>
        ) : null}
      </ul>
    </>
  )
}
