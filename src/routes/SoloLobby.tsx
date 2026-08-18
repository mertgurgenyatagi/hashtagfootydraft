import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChipGroup, Collapse } from '../components/lobby/ChipGroup'
import { LobbyLayout } from '../components/lobby/LobbyLayout'
import { ScopeDetail } from '../components/lobby/ScopeDetail'
import { SeatList, type Seat } from '../components/lobby/SeatList'
import { Button } from '../components/ui/Button'
import { formats } from '../data/formats'
import { MAX_SEATS, constraints, scopes, timers } from '../data/lobbyOptions'
import {
  effectiveSize,
  hasDimmedOptions,
  isConfigViable,
  isConstraintAvailable,
  isFormatAvailable,
  isLeagueAvailable,
  isScopeAvailable,
  scopeKeyOf,
  seatsPhrase,
  unavailableReason,
} from '../lib/draftViability'

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

  /**
   * How many drafters the settings have to seat. Every option below is
   * measured against this, so adding or removing a bot re-reads the panel.
   */
  const size = effectiveSize(seats.length)
  const key = scopeKeyOf(scope, league)
  const seatsHint = seatsPhrase(size)

  const viable = isConfigViable(format, scope, league, constraint, size)
  const reason = unavailableReason(format, scope, league, constraint, size)
  const dimmed = hasDimmedOptions(format, scope, league, size)

  const resting = !format
    ? 'Pick a format to start.'
    : reason
      ? reason
      : dimmed
        ? `Dimmed options don’t support ${seatsHint}.`
        : ''

  return (
    <LobbyLayout
      leftHeadingId="table-heading"
      seatCountLabel={`${seats.length} / ${MAX_SEATS} seats`}
      seatCountKey={seats.length}
      leftHeaderContent={
        <h1
          id="table-heading"
          className="fx fx-soft mt-[clamp(0.4rem,1.6vh,1rem)] hidden font-display text-[clamp(1.6rem,3.4vw,2.75rem)] font-bold uppercase leading-[0.95] tracking-[0.02em] md:block"
          style={{ animationDelay: '140ms' }}
        >
          Your table
        </h1>
      }
      seatList={
        <SeatList
          seats={seats}
          onAdd={() => {
            const id = nextBotId.current
            nextBotId.current += 1
            setBots((current) => [...current, id])
          }}
          onRemove={(id) => setBots((current) => current.filter((entry) => String(entry) !== id))}
        />
      }
      leftFooterContent={
        <>
          <div className="hidden flex-1 md:block" />
          <p
            className="fx fx-soft hidden max-w-[46ch] text-[10.5px] leading-[1.5] text-dim md:block"
            style={{ animationDelay: '560ms' }}
          >
            Two to five at the table, you included. Bots are added one at a time and all play the
            same default style.
          </p>
        </>
      }
      rightHeaderLabel="What you're playing"
      settingsContent={
        <>
          <ChipGroup
            label="Format"
            options={formats}
            value={format}
            onChange={setFormat}
            isUnavailable={(id) => !isFormatAvailable(id, size)}
            unavailableHint={seatsHint}
            delayMs={260}
          />

          <div className={GROUP_GAP}>
            <ChipGroup
              label="Scope"
              options={scopes}
              value={scope}
              onChange={setScope}
              isUnavailable={(id) => !isScopeAvailable(format, id, size)}
              unavailableHint={seatsHint}
              delayMs={340}
            >
              <ScopeDetail
                scope={scope}
                league={league}
                onLeagueChange={setLeague}
                isLeagueUnavailable={(id) => !isLeagueAvailable(format, id, size)}
                unavailableHint={seatsHint}
              />
            </ChipGroup>
          </div>

          <Collapse open={takesConstraint}>
            <div className={GROUP_GAP}>
              <ChipGroup
                label="Constraint"
                options={constraints}
                value={constraint}
                onChange={setConstraint}
                isUnavailable={(id) => !isConstraintAvailable(format, key, id, size)}
                unavailableHint={seatsHint}
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
        </>
      }
      statusMessage={status || resting}
      statusKey={statusKey}
      backControl={
        <Link
          to="/"
          className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted transition-colors duration-150 ease-out hover:text-ink"
        >
          Back to home
        </Link>
      }
      actionControl={
        <Button
          variant="accent"
          disabled={!viable}
          onClick={() => report('The draft screen isn’t built yet.')}
        >
          Kick off →
        </Button>
      }
    />
  )
}
