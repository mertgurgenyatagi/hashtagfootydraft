export interface HeroPlayer {
  /** Used to build the eventual asset path: /players/{slug}.webp */
  slug: string
  /** Short form shown on the card — the full name would truncate. */
  surname: string
  club: string
  /** Formation slot code, per the fixed 4-2-3-1 in PROJECT.md. */
  position: string
  /** Squad number, also the ghosted figure in the placeholder art. */
  number: number
}

/**
 * The marquee cast — the highest-ability players in player_data.csv, hand-picked
 * for club spread. Purely decorative: this is not the draft pool, and nothing
 * reads it except the home page.
 */
export const heroPlayers: HeroPlayer[] = [
  { slug: 'haaland', surname: 'Haaland', club: 'Manchester City', position: 'ST', number: 9 },
  { slug: 'mbappe', surname: 'Mbappé', club: 'Real Madrid', position: 'ST', number: 10 },
  { slug: 'saka', surname: 'Saka', club: 'Arsenal', position: 'RW', number: 7 },
  { slug: 'de-bruyne', surname: 'De Bruyne', club: 'Napoli', position: 'AMF', number: 17 },
  { slug: 'van-dijk', surname: 'Van Dijk', club: 'Liverpool', position: 'CB', number: 4 },
  { slug: 'kane', surname: 'Kane', club: 'Bayern Munich', position: 'ST', number: 9 },
  { slug: 'rodri', surname: 'Rodri', club: 'Manchester City', position: 'CDM', number: 16 },
  { slug: 'vinicius-junior', surname: 'Vinícius Jr', club: 'Real Madrid', position: 'LW', number: 7 },
  { slug: 'messi', surname: 'Messi', club: 'Inter Miami', position: 'AMF', number: 10 },
  { slug: 'courtois', surname: 'Courtois', club: 'Real Madrid', position: 'GK', number: 1 },
  { slug: 'salah', surname: 'Salah', club: 'Trabzonspor', position: 'RW', number: 11 },
  { slug: 'bellingham', surname: 'Bellingham', club: 'Real Madrid', position: 'AMF', number: 5 },
  { slug: 'lewandowski', surname: 'Lewandowski', club: 'Chicago', position: 'ST', number: 9 },
  { slug: 'odegaard', surname: 'Ødegaard', club: 'Arsenal', position: 'AMF', number: 8 },
]
