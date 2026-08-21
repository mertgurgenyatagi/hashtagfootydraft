import { faceCenters } from '../../data/faceAnchors'
import type { Sale } from '../../lib/auctionEngine'
import type { Drafter } from '../../lib/draftEngine'
import { slugify } from '../../lib/players'
import { SectionLabel } from '../ui/SectionLabel'

/** Same fallback every other photo surface in the app uses. */
const DEFAULT_CENTER: [number, number] = [0.5, 0.35]

interface SoldRecordProps {
  sales: Sale[]
  drafters: Drafter[]
  youSeat: number
  /** The lot number nobody is allowed to see yet, or null once the list is out. */
  nextLot: number | null
  /** How many cards fit the rail. Two columns, so an even number reads best. */
  show?: number
}

/**
 * What has already gone — the left rail, and the only record of the auction's
 * own history on the screen.
 *
 * Drawn as square-cropped faces rather than as the ruled list layout 01 first
 * had: a lot is a footballer before it is a price, and at rail width a square
 * photograph says which footballer far faster than a surname in 12px does.
 * *(Layout 09's card treatment, carried across on Mert's instruction.)*
 *
 * An unsold lot stays in the record rather than disappearing — passing on a
 * footballer is a real event *(R8-Q4)*, and a record that only listed sales
 * would quietly rewrite what happened. It is dimmed whole, photograph and
 * crest included, which is the same treatment every other unavailable thing in
 * this app gets and the only one that respects the never-recolour-a-crest rule.
 *
 * The sealed tile underneath is the boundary. Upcoming lots are a mystery, so
 * the edge between what you can see and what you cannot is drawn as an object
 * rather than left as an absence.
 */
export function SoldRecord({ sales, drafters, youSeat, nextLot, show = 4 }: SoldRecordProps) {
  const recent = sales.slice(-show).reverse()

  return (
    <section className="flex shrink-0 flex-col gap-[10px]">
      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>Sold</SectionLabel>
        <span className="tabular font-display text-[9.5px] font-medium uppercase tracking-[0.16em] text-dim">
          {sales.length}
        </span>
      </div>

      <ul className="auction-sold">
        {recent.map((sale) => {
          const mine = sale.seat === youSeat
          const buyer = sale.seat === null ? null : drafters[sale.seat]
          const [fx, fy] = faceCenters[slugify(sale.player.name)] ?? DEFAULT_CENTER

          return (
            <li
              key={sale.lot}
              className={[
                'fx fx-soft flex flex-col overflow-hidden border bg-surface',
                buyer === null ? 'border-line opacity-40' : mine ? 'border-accent-line' : 'border-line',
              ].join(' ')}
            >
              <span className="auction-sold-face block w-full overflow-hidden bg-surface-2">
                <img
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${fx * 100}% ${fy * 100}%` }}
                  src={sale.player.portrait}
                  alt={sale.player.name}
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              </span>

              <span className="flex items-center justify-between gap-2 px-[7px] pb-[5px] pt-[5px]">
                <span className="truncate text-[11px] font-medium leading-none text-ink">
                  {sale.player.surname}
                </span>
                <span
                  className={[
                    'tabular shrink-0 font-display text-[12px] font-semibold leading-none',
                    mine ? 'text-accent' : 'text-ink',
                    buyer === null ? '' : 'money',
                  ].join(' ')}
                >
                  {buyer === null ? '—' : sale.price}
                </span>
              </span>

              <span className="flex items-center gap-[5px] px-[7px] pb-[6px]">
                <img className="crest h-[12px] w-[12px] shrink-0" src={sale.player.crest} alt="" />
                <span
                  className={[
                    'truncate font-display text-[8.5px] font-medium uppercase tracking-[0.18em]',
                    mine ? 'text-accent' : 'text-dim',
                  ].join(' ')}
                >
                  {buyer === null ? 'Unsold' : buyer.name}
                </span>
              </span>
            </li>
          )
        })}

        {recent.length === 0 ? (
          <li className="auction-seal col-span-2 grid h-[46px] place-items-center">
            <span className="tabular font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">
              —
            </span>
          </li>
        ) : null}
      </ul>

      {nextLot !== null ? (
        <span className="auction-seal grid h-[30px] shrink-0 place-items-center">
          <span className="tabular font-display text-[11.5px] font-semibold uppercase tracking-[0.14em] text-dim">
            {nextLot} · ?
          </span>
        </span>
      ) : null}
    </section>
  )
}
