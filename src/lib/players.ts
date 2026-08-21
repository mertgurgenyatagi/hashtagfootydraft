import { clubLeagues } from '../data/clubs'
import type { PositionCode } from '../data/formation'
import type { LeagueId } from '../data/lobbyOptions'

export interface Player {
  /** Stable across a session — name and club together, because one name repeats. */
  id: string
  name: string
  /** What the pitch prints. The last word of the name, which is what a teamsheet uses. */
  surname: string
  nation: string
  age: number
  club: string
  clubSlug: string
  league: LeagueId
  position: PositionCode
  /**
   * Read by the bots when they choose, and by the timeout auto-pick. Never
   * rendered: ability is a data-model fact and this app keeps those off screen,
   * which is also why the pool is ordered A–Z rather than by this number.
   */
  ability: number
  /** Also never rendered — Free Pick has no currency. The auto-pick uses it. */
  price: number
  crest: string
  /** Not a usable image URL on its own — see `cellGridSrc`. Points at
   * `players-cells/{slug}`, the standardised 80×100 colour-grid raster the
   * `Dotgrid` component reads; the per-frame crop into it is CSS, not data. */
  portraitBase: string
}

/**
 * Every distinct place a player photo actually renders on screen — one entry
 * per crop tuned in `Dotgrid.tsx`'s `FRAME_CROPS`.
 */
export type DotgridFrame =
  | 'spare-face'
  | 'auction-block'
  | 'box-stage'
  | 'box-grid-tile'
  | 'pitch-node'
  | 'sold-record-face'
  | 'spotlight-free-pick'
  | 'spotlight-spin'

/**
 * Frames settled on different source densities during tuning (a hero surface
 * wants more columns than a tiny avatar), so the density is part of the
 * filename — `make_dotgrid_cells.py` generates one file per player per
 * density actually used by some `FRAME_CROPS` entry, not per frame name.
 */
export function cellGridSrc(player: Pick<Player, 'portraitBase'>, density: number): string {
  return `${player.portraitBase}--${density}.webp`
}

/**
 * The full-resolution standardised crop `players-cells/` was itself
 * downsampled from — production code never needs this, only
 * `DotgridTuner.tsx`, to regenerate a grid at a different density client-side
 * while tuning.
 */
export function fullResCropSrc(player: Pick<Player, 'portraitBase'>): string {
  return `${player.portraitBase.replace('players-cells/', 'players-4x5/')}.webp`
}

/**
 * Characters `NFKD` will not decompose, because they are letters in their own
 * right rather than an ASCII letter wearing a mark. The portrait files on disk
 * were named through the same folding, so Ødegaard has to land on `odegaard`
 * or his picture never loads.
 */
const FOLD: Record<string, string> = {
  ø: 'o',
  ß: 'ss',
  ð: 'd',
  đ: 'd',
  ł: 'l',
  æ: 'ae',
  œ: 'oe',
  þ: 'th',
  ı: 'i',
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[øßðđłæœþı]/g, (character) => FOLD[character] ?? character)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * A comma inside a quoted field is a comma, not a column break. Small enough to
 * hand-roll and small enough to read — the pool is one 40KB file, parsed once.
 */
function parseRow(line: string): string[] {
  const cells: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (quoted) {
      if (character === '"') {
        if (line[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      cells.push(cell)
      cell = ''
    } else {
      cell += character
    }
  }

  cells.push(cell)
  return cells
}

const POSITIONS = new Set<string>([
  'GK',
  'CB',
  'LB',
  'RB',
  'CDM',
  'CM',
  'AMF',
  'LW',
  'RW',
  'ST',
])

const base = import.meta.env.BASE_URL

export function crestUrl(clubSlug: string): string {
  return `${base}clubs/${clubSlug}.svg`
}

/**
 * The pool, read from the same CSV every other part of this project measures
 * against.
 *
 * Scope comes from the club rather than from the file's own `League` column:
 * that column names the competition a row was scraped from, so it puts
 * Fenerbahçe in Serie A and Flamengo in the Spanish first division. `clubs.ts`
 * is the map that actually holds, and a club with no crest is a club this
 * screen cannot draw — so it is not in the pool at all.
 */
export async function loadPool(signal?: AbortSignal): Promise<Player[]> {
  const response = await fetch(`${base}player_data.csv`, { signal })
  if (!response.ok) throw new Error(`Could not read the player pool (${response.status})`)

  const text = await response.text()
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const header = parseRow(lines[0]).map((cell) => cell.trim())
  const column = (name: string) => header.indexOf(name)

  const nameAt = column('Name')
  const nationAt = column('Nation')
  const ageAt = column('Age')
  const clubAt = column('Club')
  const positionAt = column('Position')
  const abilityAt = column('Current Ability')
  const priceAt = column('Derived Price (EURm)')

  const players: Player[] = []
  const seen = new Set<string>()

  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseRow(lines[index])
    const name = cells[nameAt]?.trim()
    const club = cells[clubAt]?.trim()
    const position = cells[positionAt]?.trim()
    if (!name || !club || !POSITIONS.has(position)) continue

    const clubSlug = slugify(club)
    const league = clubLeagues[clubSlug]
    if (!league) continue

    const id = `${slugify(name)}|${clubSlug}`
    if (seen.has(id)) continue
    seen.add(id)

    players.push({
      id,
      name,
      surname: teamsheetName(name),
      nation: cells[nationAt]?.trim() ?? '',
      age: Number(cells[ageAt]) || 0,
      club,
      clubSlug,
      league,
      position: position as PositionCode,
      ability: Number(cells[abilityAt]) || 0,
      price: Number(cells[priceAt]) || 0,
      crest: crestUrl(clubSlug),
      portraitBase: `${base}players-cells/${slugify(name)}`,
    })
  }

  // A–Z, and by club after that so the two Edersons keep a stable order.
  // Deliberately *not* by ability: hiding the number while sorting by it is a
  // distinction without a difference, and the number stays off this screen.
  players.sort((a, b) => a.name.localeCompare(b.name) || a.club.localeCompare(b.club))
  return players
}

/**
 * What a team sheet calls this footballer. The last word of the name, except
 * when the last word is not a name — a generational suffix belongs to the word
 * in front of it, so Vinícius Júnior is Vinícius and never Júnior.
 */
const SUFFIXES = new Set(['jr', 'jr.', 'junior', 'júnior', 'neto', 'filho', 'ii', 'iii'])

function teamsheetName(name: string): string {
  const words = name.split(' ').filter(Boolean)
  const last = words[words.length - 1]
  if (words.length > 1 && SUFFIXES.has(last.toLowerCase())) return words[words.length - 2]
  return last
}

/** Scope, as the lobby sets it. `top-5` is every club we hold a crest for. */
export function inScope(player: Player, scope: string, league: string): boolean {
  if (scope === 'league') return player.league === league
  return true
}
