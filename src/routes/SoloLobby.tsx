import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChipGroup, Collapse } from '../components/lobby/ChipGroup'
import { LobbyPlate } from '../components/lobby/LobbyPlate'
import { ScopeDetail } from '../components/lobby/ScopeDetail'
import { SeatList, type Seat } from '../components/lobby/SeatList'
import { formats } from '../data/formats'
import { MAX_SEATS, constraints, scopes, timers } from '../data/lobbyOptions'

/** The space above a settings group, applied inside it so it collapses with it. */
const GROUP_GAP = 'pt-[var(--lobby-gap)]'

/**
 * The single-player lobby — a hard diptych. Who is playing on the left, on a
 * surface step; what they're playing on the right, on the ground. The step is
 * the division; there is no rule between them.
 *
 * Format is carried in on the URL from whichever tile was clicked at home.
 * Landing here without one leaves every format unpicked rather than defaulting
 * to any of them — the four are equals.
 *
 * Kicking off is still an honest dead end: the draft screen doesn't exist, so
 * the status line says so instead of faking a destination.
 */
export function SoloLobby() {
  const { formatId } = useParams()

  // Keyed on the format so arriving at a *different* one — a second tile, a
  // pasted link — rebuilds the screen. Without it React reuses the instance
  // and the seeded state below never re-runs.
  return <ReadyRoom key={formatId ?? 'none'} formatId={formatId} />
}

function ReadyRoom({ formatId }: { formatId?: string }) {
  const [format, setFormat] = useState<string | null>(() =>
    formats.some((entry) => entry.id === formatId) ? (formatId as string) : null,
  )
  const [scope, setScope] = useState('top-5')
  const [league, setLeague] = useState('premier-league')
  const [nation, setNation] = useState('England')
  const [constraint, setConstraint] = useState('club-1')
  const [timer, setTimer] = useState('15')

  /** Ids rather than a count, so adding a seat animates only the row that arrived. */
  const nextBotId = useRef(4)
  const [bots, setBots] = useState<number[]>([1, 2, 3])

  const [status, setStatus] = useState('')
  const [statusKey, setStatusKey] = useState(0)

  const report = (message: string) => {
    setStatus(message)
    setStatusKey((key) => key + 1)
  }

  const seats: Seat[] = [
    {
      id: 'you',
      kind: 'you',
      name: 'You',
      mark: 'Y',
      note: 'Host — sets the draft on the right',
      tag: 'Seat 1',
    },
    ...bots.map((id, index) => ({
      id: String(id),
      kind: 'bot' as const,
      name: `Bot ${index + 1}`,
      mark: String(index + 1),
      note: 'Default style',
    })),
  ]

  /** Constraints exist for Free Pick and are not offered anywhere else. */
  const takesConstraint = format === 'free-pick'

  return (
    <div className="lobby relative flex h-[100dvh] flex-col overflow-hidden md:flex-row">
      {/* ══ Who is playing ══ */}
      <section
        aria-labelledby="table-heading"
        className="fx fx-fade flex shrink-0 flex-col bg-surface px-[clamp(1.1rem,3vw,2.75rem)] py-[var(--lobby-pad-y)] md:h-full md:w-1/2"
      >
        {/* The label and the display heading are the first things to go on a
            short viewport — the discs and the count say the same thing, and
            the settings half needs every pixel they were using. */}
        <div
          className="fx fx-soft hidden items-baseline justify-between gap-4 md:flex"
          style={{ animationDelay: '80ms' }}
        >
          <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            Who's playing
          </span>
          <span
            key={seats.length}
            className="tabular fx fx-fade shrink-0 font-display text-[11px] font-medium uppercase tracking-[0.1em] text-dim"
          >
            {seats.length} / {MAX_SEATS} seats
          </span>
        </div>

        <h1
          id="table-heading"
          className="fx fx-soft mt-[clamp(0.4rem,1.6vh,1rem)] hidden font-display text-[clamp(1.6rem,3.4vw,2.75rem)] font-bold uppercase leading-[0.95] tracking-[0.02em] md:block"
          style={{ animationDelay: '140ms' }}
        >
          Your table
        </h1>

        <SeatList
          seats={seats}
          onAdd={() => {
            const id = nextBotId.current
            nextBotId.current += 1
            setBots((current) => [...current, id])
          }}
          onRemove={(id) => setBots((current) => current.filter((entry) => String(entry) !== id))}
        />

        <div className="hidden flex-1 md:block" />

        <p
          className="fx fx-soft hidden max-w-[46ch] text-[10.5px] leading-[1.5] text-dim md:block"
          style={{ animationDelay: '560ms' }}
        >
          Two to five at the table, you included. Bots are added one at a time and all play the
          same default style.
        </p>
      </section>

      {/* ══ What they're playing ══ */}
      <section
        aria-label="Draft settings"
        className="relative flex min-h-0 flex-1 flex-col px-[clamp(1.1rem,3vw,2.75rem)] py-[var(--lobby-pad-y)] md:h-full md:w-1/2 md:flex-none"
      >
        <LobbyPlate />

        <div
          className="fx fx-soft relative z-10 flex items-baseline justify-between gap-4"
          style={{ animationDelay: '120ms' }}
        >
          <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
            What you're playing
          </span>
          <Link
            to="/"
            aria-label="#footydraft — back to the home page"
            className="shrink-0 font-wordmark text-[19px] uppercase leading-none tracking-[0.06em] text-ink transition-opacity duration-150 ease-out hover:opacity-70"
          >
            <span className="text-accent">#</span>footydraft
          </Link>
        </div>

        {/* No column gap: each group carries its own top spacing, so a group
            that collapses takes the space above it with it instead of leaving
            a group-sized hole in the panel. */}
        <div className="relative z-10 mt-[var(--lobby-gap)] flex flex-col">
          <ChipGroup
            label="Format"
            options={formats}
            value={format}
            onChange={setFormat}
            delayMs={260}
          />

          <div className={GROUP_GAP}>
            <ChipGroup
              label="Scope"
              options={scopes}
              value={scope}
              onChange={setScope}
              delayMs={340}
            >
              <ScopeDetail
                scope={scope}
                league={league}
                onLeagueChange={setLeague}
                nation={nation}
                onNationChange={setNation}
              />
            </ChipGroup>
          </div>

          {/* Free Pick's setting, and nobody else's — it isn't offered
              elsewhere rather than being shown greyed out. */}
          <Collapse open={takesConstraint}>
            <div className={GROUP_GAP}>
              <ChipGroup
                label="Constraint"
                options={constraints}
                value={constraint}
                onChange={setConstraint}
                note="One per draft — constraints don't stack."
                delayMs={420}
              />
            </div>
          </Collapse>

          <div className={GROUP_GAP}>
            <ChipGroup
              label="Turn timer"
              options={timers}
              value={timer}
              onChange={setTimer}
              delayMs={500}
            />
          </div>
        </div>

        <div className="hidden flex-1 md:block" />

        <div className="relative z-10 mt-[var(--lobby-gap)]">
          {/* One line, two jobs: the reason a disabled control is disabled, and
              the report from a control that has nowhere to go yet. Fixed
              height, so it appears without shunting the row under it. */}
          <p
            key={statusKey}
            aria-live="polite"
            className="fx fx-fade h-4 truncate text-[11px] leading-4 text-muted md:h-5 md:text-[12px] md:leading-5"
          >
            {status || (format ? '' : 'Pick a format to start.')}
          </p>

          <div
            className="fx fx-soft mt-[clamp(0.35rem,1.2vh,0.75rem)] flex items-center justify-between gap-4"
            style={{ animationDelay: '600ms' }}
          >
            <Link
              to="/"
              className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted transition-colors duration-150 ease-out hover:text-ink"
            >
              Back to home
            </Link>

            <button
              type="button"
              disabled={!format}
              onClick={() => report('The draft screen isn’t built yet.')}
              className="shrink-0 rounded-[2px] border border-accent bg-accent px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.5rem,1.6vh,1.125rem)] font-display text-[clamp(0.75rem,1.1vw,0.9375rem)] font-semibold uppercase tracking-[0.1em] text-accent-ink transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-transparent hover:text-accent active:translate-y-px disabled:border-line disabled:bg-transparent disabled:text-faint"
            >
              Kick off →
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
