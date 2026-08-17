import { Collapse } from './ChipGroup'
import { leagues, nations } from '../../data/lobbyOptions'

interface ScopeDetailProps {
  scope: string
  league: string
  onLeagueChange: (id: string) => void
  nation: string
  onNationChange: (nation: string) => void
  /** A guest sees what the host narrowed it to, and can't move it. */
  readOnly?: boolean
}

/**
 * Two of the four scopes narrow further, and this is where they do it. The row
 * collapses away entirely for the two that don't, so the panel is never
 * holding space for a control that isn't on offer.
 *
 * Leagues are picked by their mark, not their name — the marks are the
 * identifier. Two of the five are dark and would otherwise vanish against the
 * ground, so the crests carry a 1px ink stroke (`.crest`): an outline drawn
 * around the artwork, which leaves every colour inside it untouched. Selection
 * is drawn on the chip, never on the crest.
 *
 * Nations are a select rather than chips: sixty-one of them is a list.
 */
export function ScopeDetail({
  scope,
  league,
  onLeagueChange,
  nation,
  onNationChange,
  readOnly = false,
}: ScopeDetailProps) {
  const showLeagues = scope === 'league'
  const showNations = scope === 'nation'
  const selected = leagues.find((entry) => entry.id === league)

  return (
    <Collapse open={showLeagues || showNations}>
      {/* Inside the collapsing box, so the spacing collapses with the row. */}
      <div className="mt-[var(--lobby-chip-mt)]">
        {readOnly ? (
          <div className="flex items-center gap-[clamp(0.25rem,0.7vw,0.5rem)]">
            {showLeagues ? (
              <span className="grid h-[var(--lobby-crest)] w-[clamp(2rem,5vw,3.25rem)] place-items-center rounded-[2px] border border-accent bg-accent-soft">
                <img
                  src={`${import.meta.env.BASE_URL}leagues/${league}.svg`}
                  alt=""
                  draggable={false}
                  className="crest h-[64%] w-[64%] object-contain"
                />
              </span>
            ) : null}
            <span className="ml-1 truncate font-display text-[10px] font-medium uppercase tracking-[0.16em] text-dim">
              {showLeagues ? selected?.name : nation}
            </span>
          </div>
        ) : showNations ? (
          <>
            <label className="sr-only" htmlFor="lobby-nation">
              Nation
            </label>
            <select
              id="lobby-nation"
              value={nation}
              onChange={(event) => onNationChange(event.target.value)}
              className="rounded-[2px] border border-line bg-ground px-3 py-[var(--lobby-chip-py)] font-display text-[clamp(0.625rem,1vw,0.8125rem)] font-medium uppercase tracking-[0.08em] text-ink transition-colors duration-150 ease-out hover:border-line-strong focus:border-accent-line focus:outline-none"
            >
              {nations.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div className="flex items-center gap-[clamp(0.25rem,0.7vw,0.5rem)]">
            {leagues.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-label={entry.name}
                aria-pressed={entry.id === league}
                onClick={() => onLeagueChange(entry.id)}
                className={[
                  'grid h-[var(--lobby-crest)] w-[clamp(2rem,5vw,3.25rem)] place-items-center',
                  'rounded-[2px] border transition-colors duration-150 ease-out',
                  entry.id === league
                    ? 'border-accent bg-accent-soft'
                    : 'border-line hover:border-line-strong',
                ].join(' ')}
              >
                <img
                  src={`${import.meta.env.BASE_URL}leagues/${entry.id}.svg`}
                  alt=""
                  draggable={false}
                  className="crest h-[64%] w-[64%] object-contain"
                />
              </button>
            ))}

            <span className="ml-1 truncate font-display text-[10px] font-medium uppercase tracking-[0.16em] text-dim">
              {selected?.name}
            </span>
          </div>
        )}
      </div>
    </Collapse>
  )
}
