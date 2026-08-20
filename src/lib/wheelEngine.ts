import { leagues } from '../data/lobbyOptions'
import { type Squad, isEligible } from './draftEngine'
import type { Player } from './players'

/**
 * Spin the Wheel's own rules, kept pure and away from React for the same
 * reason `draftEngine.ts` is: this is the file to read when a rule is in
 * question.
 *
 * The pick itself is a free pick — same slot gate, same snake order, same
 * A–Z pool — so everything about *choosing* still comes out of
 * `draftEngine.ts`. What lives here is only the wheel: which category it is
 * drawn from, which slices it currently has, and where it stops.
 */

export type WheelCategory = 'league' | 'club' | 'nation'

export interface WheelSlice {
  /** The entity's own key: a league id, a club slug or a nation name. */
  key: string
  /** Set in Oswald in the hub when the wheel stops here. */
  label: string
  /** A crest, where one exists. Nations have no mark and get their letters. */
  mark: string | null
}

const base = import.meta.env.BASE_URL

export function leagueMark(id: string): string {
  return `${base}leagues/${id}.svg`
}

/**
 * Which single category the whole draft's wheel is drawn from. It is decided
 * once, at the start, and never changes between spins.
 *
 * Scope fixes one axis and the wheel takes another: `All players` and
 * `Top 5 leagues` leave league, club and nationality all open, and league is
 * the one that renders as five legible slices with a real mark in each. A
 * single-league Scope has already fixed league, so the wheel drops to clubs.
 */
export function categoryFor(scope: string): WheelCategory {
  return scope === 'league' ? 'club' : 'league'
}

export function entityKey(player: Player, category: WheelCategory): string {
  if (category === 'league') return player.league
  if (category === 'club') return player.clubSlug
  return player.nation
}

function entityLabel(player: Player, category: WheelCategory): string {
  if (category === 'league') {
    return leagues.find((league) => league.id === player.league)?.name ?? player.league
  }
  if (category === 'club') return player.club
  return player.nation
}

function entityMark(player: Player, category: WheelCategory): string | null {
  if (category === 'league') return leagueMark(player.league)
  if (category === 'club') return player.crest
  return null
}

/**
 * One equal slice for every entity that currently holds at least one
 * footballer the drafter on the clock could legally take — so a league whose
 * remaining players all play in positions you have already filled is not on
 * the wheel at all, rather than being a slice that lands on nothing.
 *
 * Which means the wheel is rebuilt for whoever is picking, not once for the
 * table. Leagues keep the lobby's order so the wheel does not reshuffle its
 * colours between spins; clubs and nations go A–Z.
 */
export function wheelSlices(
  pool: Player[],
  squad: Squad,
  taken: ReadonlySet<string>,
  category: WheelCategory,
): WheelSlice[] {
  const found = new Map<string, WheelSlice>()

  for (const player of pool) {
    if (!isEligible(player, squad, 'none', taken)) continue
    const key = entityKey(player, category)
    if (found.has(key)) continue
    found.set(key, { key, label: entityLabel(player, category), mark: entityMark(player, category) })
  }

  const slices = [...found.values()]

  if (category === 'league') {
    const order = leagues.map((league) => league.id)
    return slices.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  }

  return slices.sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * Where the wheel stops so that slice `index` sits under the pointer at the
 * top. Always at least four whole turns further round than it is now — a
 * wheel that takes the short way to the next result reads as a dial being
 * set rather than as a wheel being spun.
 *
 * The landing is jittered inside the slice rather than always dead-centre,
 * because a pointer that stops on the exact middle every single time looks
 * like a lookup, which is what this is trying not to look like.
 */
export function landingRotation(
  current: number,
  index: number,
  count: number,
  random: () => number = Math.random,
): number {
  if (count <= 0 || index < 0) return current + 360 * 4
  const step = 360 / count
  const target = -((index + 0.5) * step) + (random() - 0.5) * step * 0.56
  const next = current + 360 * 4
  return next + (((target - next) % 360) + 360) % 360
}

/**
 * The wheel's face. A hard-stopped conic gradient rather than eleven rotated
 * elements: one paint, no seams, and it survives any slice count the pool
 * hands it. Each boundary carries a hairline of the ground colour so the
 * slices read as cut rather than as a blend.
 */
export function sliceGradient(colours: string[]): string {
  const count = colours.length
  if (count === 0) return `conic-gradient(var(--color-surface) 0deg 360deg)`

  const step = 360 / count
  const cut = Math.min(1.4, step * 0.06)
  const stops: string[] = []

  colours.forEach((colour, index) => {
    const from = index * step
    stops.push(`var(--color-ground) ${from}deg ${from + cut}deg`)
    stops.push(`${colour} ${from + cut}deg ${from + step}deg`)
  })

  return `conic-gradient(from 0deg, ${stops.join(', ')})`
}

/**
 * The one place in the app that paints outside the four primes without a
 * licensed crest in its hand — see the note on `--color-league-*` in
 * index.css. Anything that is not one of the five leagues falls back to a
 * ramp mixed from the primes.
 */
const NEUTRAL_RAMP = [
  'var(--color-surface-2)',
  'var(--color-shade)',
  'var(--color-surface)',
  'var(--color-accent-ink)',
]

export function sliceColours(slices: WheelSlice[], category: WheelCategory): string[] {
  if (category === 'league') return slices.map((slice) => `var(--color-league-${slice.key})`)
  return slices.map((_, index) => NEUTRAL_RAMP[index % NEUTRAL_RAMP.length])
}
