import { heroPlayers, type HeroPlayer } from '../../data/heroPlayers'
import { PlayerImage } from '../ui/PlayerImage'

function MarqueeCard({ player }: { player: HeroPlayer }) {
  return (
    <figure className="group/card relative w-[clamp(11.5rem,19vw,17rem)] shrink-0 overflow-hidden rounded-xl border border-line bg-surface transition duration-300 ease-out hover:-translate-y-1">
      <PlayerImage
        src={`/players/${player.slug}.webp`}
        alt={`${player.surname}, ${player.club}`}
        fallbackNumber={player.number}
        className="aspect-[39/18] w-full object-cover opacity-55 saturate-50 transition duration-300 ease-out group-hover/card:opacity-100 group-hover/card:saturate-100"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ground/95 via-ground/70 to-transparent px-3 pb-2 pt-7">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-display text-[0.82rem] font-medium uppercase tracking-[0.05em] text-ink">
            {player.surname}
          </span>
          <span className="font-display text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted">
            {player.position}
          </span>
        </div>
        <div className="truncate text-[0.65rem] text-muted">{player.club}</div>
      </figcaption>
    </figure>
  )
}

/** One copy of the cast. Two identical copies sit side by side in the track,
 *  so translating the track by exactly -50% wraps seamlessly. */
function MarqueeRow({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 gap-3 pr-3" aria-hidden={hidden || undefined}>
      {heroPlayers.map((player) => (
        <MarqueeCard key={player.slug} player={player} />
      ))}
    </div>
  )
}

export function PlayerMarquee() {
  return (
    // overflow-hidden clips the double-width track; pt-2 leaves room for the
    // hover lift so it isn't sheared off by that clip.
    <div className="marquee relative overflow-hidden pt-2 pb-6 [@media(max-height:600px)]:hidden">
      <div className="marquee-track flex w-max">
        <MarqueeRow />
        <MarqueeRow hidden />
      </div>

      {/* Edge fades, so cards dissolve into the ground rather than being cut off. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ground to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ground to-transparent sm:w-28" />
    </div>
  )
}
