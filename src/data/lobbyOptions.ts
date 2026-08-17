/**
 * Everything the single-player lobby can be set to. One shape for all of it —
 * the settings panel renders any of these lists the same way.
 */
export interface Choice {
  id: string
  /** Set in Oswald, uppercase, on the chip. */
  name: string
}

/** Four values, per the configuration rules. Two of them narrow further below. */
export const scopes: Choice[] = [
  { id: 'all', name: 'All players' },
  { id: 'top-5', name: 'Top 5 leagues' },
  { id: 'league', name: 'One league' },
  { id: 'nation', name: 'One nation' },
]

/**
 * The five leagues that have a mark in `public/leagues/`. The crest is the
 * label — these are the identifier, and they render full colour and unfiltered
 * because a recoloured badge is a falsified badge. Selection is drawn on the
 * chip around the mark, never on the mark itself.
 */
export const leagues: Choice[] = [
  { id: 'premier-league', name: 'Premier League' },
  { id: 'la-liga', name: 'La Liga' },
  { id: 'serie-a', name: 'Serie A' },
  { id: 'bundesliga', name: 'Bundesliga' },
  { id: 'ligue-1', name: 'Ligue 1' },
]

/** Exactly one is active per draft — they don't stack. Free Pick only. */
export const constraints: Choice[] = [
  { id: 'club-1', name: '1 per club' },
  { id: 'club-3', name: '3 per club' },
  { id: 'nation-1', name: '1 per nation' },
  { id: 'nation-3', name: '3 per nation' },
]

/** Per turn, in every format — not just the bidding one. */
export const timers: Choice[] = [
  { id: '10', name: '10 s' },
  { id: '15', name: '15 s' },
  { id: '30', name: '30 s' },
  { id: '60', name: '60 s' },
  { id: 'off', name: 'Off' },
]

/**
 * A select rather than chips: sixty-one of them is a list, not a row of
 * buttons. Alphabetical, straight out of the pool.
 */
export const nations: string[] = [
  'Algeria',
  'Argentina',
  'Armenia',
  'Austria',
  'Belgium',
  'Bosnia & Herzegovina',
  'Brazil',
  'Burkina Faso',
  'Cameroon',
  'Canada',
  'Central African Rep.',
  'Colombia',
  'Costa Rica',
  'Croatia',
  'Czechia',
  'Denmark',
  'Ecuador',
  'Egypt',
  'England',
  'France',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Guinea',
  'Guinea-Bissau',
  'Hungary',
  'Iceland',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Kosovo',
  'Mali',
  'Mexico',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Netherlands',
  'Nigeria',
  'North Macedonia',
  'Norway',
  'Poland',
  'Portugal',
  'Russia',
  'Scotland',
  'Senegal',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Tunisia',
  'Türkiye',
  'U.S.A.',
  'Ukraine',
  'Uruguay',
  'Venezuela',
  'Wales',
]

/** Humans plus bots. The empty seats stay on screen either way. */
export const MIN_SEATS = 2
export const MAX_SEATS = 5
