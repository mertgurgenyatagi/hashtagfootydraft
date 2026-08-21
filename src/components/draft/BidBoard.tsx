import { BID_STEPS } from '../../lib/auctionEngine'
import type { Drafter } from '../../lib/draftEngine'
import { SectionLabel } from '../ui/SectionLabel'

interface BidBoardProps {
  drafters: Drafter[]
  youSeat: number
  /** Who holds the lot, or null while it is still at its opening price. */
  holder: number | null
  price: number
  /** The last figure each seat put up on this lot. */
  bids: Record<number, number>
  /** Seats that have passed on this lot. */
  out: number[]
  budgets: number[]
  startBudget: number
  seconds: number
  limit: number
  /** Bumped by every bid, so the drain restarts rather than easing back. */
  resetKey: number
  live: boolean
  onBid: (step: number) => void
  onPass: () => void
}

/**
 * The bottom two thirds of the centre stack: the holder readout welded to the
 * countdown it resets, the five seats bidding side by side, and the three steps.
 *
 * A real-time auction has no turn, so there is no turn indicator on this screen
 * and no turn language anywhere in it. What there is instead is a *holder* —
 * who has the lot and at what price — and a clock that measures inactivity
 * rather than anybody's window. Any bid from any seat sends it back to full.
 *
 * The increments carry two numbers each: the step, and what the step lands on.
 * A button that names only its step makes you do arithmetic against a clock.
 */
export function BidBoard({
  drafters,
  youSeat,
  holder,
  price,
  bids,
  out,
  budgets,
  startBudget,
  seconds,
  limit,
  resetKey,
  live,
  onBid,
  onPass,
}: BidBoardProps) {
  const held = holder !== null
  const youOut = out.includes(youSeat)
  const youHold = holder === youSeat
  const yourBudget = budgets[youSeat] ?? 0

  /* The first bid on a lot is exactly at the opening price, so the three steps
     are redundant until somebody has taken it and mask down to bid-or-pass. */
  const offers = held ? BID_STEPS.map((step) => ({ step, lands: price + step })) : [{ step: 0, lands: price }]

  const canRaise = live && !youOut && !youHold

  return (
    <div className="flex shrink-0 flex-col">
      {/* ---- The holder, and the clock their bid resets. ---- */}
      <div className="mt-[clamp(10px,2cqh,16px)] flex items-center gap-[16px]">
        <span
          className={[
            'flex shrink-0 items-center gap-[10px] whitespace-nowrap rounded-[2px] border px-[12px] py-[8px]',
            held ? 'border-accent-line bg-accent-soft' : 'border-line bg-surface',
          ].join(' ')}
        >
          <span
            className={[
              'font-display text-[8.5px] font-medium uppercase tracking-[0.22em]',
              held ? 'text-accent' : 'text-dim',
            ].join(' ')}
          >
            {held ? 'Holding' : 'Opening'}
          </span>

          {held ? (
            <>
              <Disc drafter={drafters[holder]} tone="lead" />
              <span className="max-w-[92px] truncate text-[13px] font-semibold leading-none text-ink">
                {drafters[holder].name}
              </span>
            </>
          ) : null}

          <span
            key={price}
            className={[
              'money tabular fx fx-soft font-display text-[19px] font-semibold leading-none',
              held ? 'text-accent' : 'text-muted',
            ].join(' ')}
          >
            {price}
          </span>
        </span>

        <span className="h-[3px] min-w-0 flex-1 overflow-hidden bg-line">
          <span
            key={resetKey}
            className="auction-drain block h-full w-full bg-accent"
            style={{ animationDuration: `${limit}s`, animationPlayState: live ? 'running' : 'paused' }}
          />
        </span>

        <span
          className={[
            'tabular auction-clock shrink-0 font-display font-semibold leading-[0.8] text-accent',
            live && seconds <= 5 ? 'narrator-pulse' : '',
          ].join(' ')}
        >
          {String(Math.max(0, Math.ceil(seconds))).padStart(2, '0')}
        </span>
      </div>

      {/* ---- The table, side by side, with what each of them has said. ---- */}
      <div className="mt-[clamp(10px,1.9cqh,15px)] flex items-baseline justify-between gap-4">
        <SectionLabel>Bids</SectionLabel>
        <SectionLabel>Budget</SectionLabel>
      </div>

      <ul className="auction-bids mt-[8px]">
        {drafters.map((drafter, seat) => {
          const high = seat === holder
          const passed = out.includes(seat)
          const bid = bids[seat]
          const budget = budgets[seat] ?? 0

          return (
            <li
              key={drafter.id}
              className={[
                'auction-bid-card relative flex min-w-0 flex-col gap-[6px] border px-[10px] pb-[8px] pt-[9px] transition-colors duration-300 ease-out',
                high
                  ? 'border-accent bg-accent-soft'
                  : seat === youSeat
                    ? 'border-line-strong bg-surface'
                    : 'border-line bg-surface',
                passed && !high ? 'opacity-40' : '',
              ].join(' ')}
            >
              {high ? (
                <span className="absolute -right-px -top-px bg-accent px-[5px] py-[2px] font-display text-[8px] font-bold uppercase leading-none tracking-[0.14em] text-accent-ink">
                  High
                </span>
              ) : null}

              <span
                className={[
                  'flex items-center gap-[6px] truncate whitespace-nowrap text-[11.5px] font-medium leading-none',
                  high || seat === youSeat ? 'text-ink' : 'text-muted',
                ].join(' ')}
              >
                <Disc drafter={drafter} tone={high ? 'lead' : seat === youSeat ? 'you' : 'plain'} />
                <span className="truncate">{drafter.name}</span>
              </span>

              <span
                key={`${bid ?? 'none'}-${resetKey}`}
                className={[
                  'tabular auction-bid fx fx-soft font-display font-semibold leading-[0.85]',
                  bid === undefined ? 'text-faint' : high ? 'money text-accent' : 'money text-dim',
                ].join(' ')}
              >
                {bid === undefined ? '—' : bid}
              </span>

              <span className="flex items-baseline justify-between gap-[6px]">
                <span className="h-[2px] min-w-0 flex-1 overflow-hidden bg-line">
                  <span
                    className="block h-full origin-left bg-accent transition-transform duration-500 ease-out"
                    style={{ transform: `scaleX(${startBudget > 0 ? budget / startBudget : 0})` }}
                  />
                </span>
                <span className="tabular shrink-0 font-display text-[11px] font-medium leading-none text-muted">
                  {budget}
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      {/* ---- Three steps, live for every seat at once. ---- */}
      <div className="mt-[clamp(9px,1.7cqh,13px)] flex items-stretch gap-[8px]">
        {offers.map((offer) => {
          const affordable = offer.lands <= yourBudget
          const enabled = canRaise && affordable

          return (
            <button
              key={offer.step}
              type="button"
              disabled={!enabled}
              onClick={() => onBid(offer.step)}
              className={[
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-[4px] rounded-[2px] border px-[6px] py-[11px] font-display font-semibold leading-none tracking-[0.04em] transition-[background-color,border-color,color] duration-150 ease-out',
                enabled
                  ? 'border-accent bg-accent text-accent-ink hover:bg-transparent hover:text-accent'
                  : 'border-line bg-transparent text-faint',
              ].join(' ')}
            >
              <span className="tabular text-[14px]">
                {held ? `+${offer.step}` : 'Bid'}
              </span>
              <span
                className={[
                  'money tabular text-[10px] font-medium',
                  enabled ? 'text-accent-ink/70' : 'text-faint',
                ].join(' ')}
              >
                {offer.lands}
              </span>
            </button>
          )
        })}

        <button
          type="button"
          disabled={!live || youOut || youHold}
          onClick={onPass}
          className={[
            'auction-pass flex w-[96px] shrink-0 flex-col items-center justify-center gap-[4px] rounded-[2px] border px-[6px] py-[11px] font-display font-semibold leading-none tracking-[0.04em] transition-colors duration-150 ease-out',
            youOut
              ? 'border-line text-faint'
              : !live || youHold
                ? 'border-line text-faint'
                : 'border-line-strong text-muted hover:border-ink hover:text-ink',
          ].join(' ')}
        >
          <span className="text-[14px] uppercase">{youOut ? 'Out' : 'Pass'}</span>
          <span className="text-[10px]">&nbsp;</span>
        </button>
      </div>
    </div>
  )
}

/** The seat disc. Bots keep their dashed outline; a bot never gets a face. */
function Disc({ drafter, tone }: { drafter: Drafter; tone: 'lead' | 'you' | 'plain' }) {
  return (
    <span
      className={[
        'auction-bid-disc grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full font-display text-[9px] font-semibold leading-none transition-colors duration-300 ease-out',
        tone === 'lead'
          ? 'border-2 border-accent text-accent'
          : tone === 'you'
            ? 'bg-accent text-accent-ink'
            : drafter.kind === 'bot'
              ? 'border border-dashed border-line-strong text-muted'
              : 'border border-line-strong text-muted',
      ].join(' ')}
    >
      {drafter.mark}
    </span>
  )
}
