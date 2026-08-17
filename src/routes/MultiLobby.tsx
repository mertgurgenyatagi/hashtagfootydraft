import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChipGroup, Collapse } from '../components/lobby/ChipGroup'
import { LobbyChat, type Message } from '../components/lobby/LobbyChat'
import { LobbyPlate } from '../components/lobby/LobbyPlate'
import { NameGate } from '../components/lobby/NameGate'
import { RoomCode } from '../components/lobby/RoomCode'
import { ScopeDetail } from '../components/lobby/ScopeDetail'
import { SeatList, type Seat } from '../components/lobby/SeatList'
import { formats } from '../data/formats'
import { MAX_SEATS, MIN_SEATS, constraints, leagues, nations, scopes, timers } from '../data/lobbyOptions'
import { CHATTER_DELAY, arrivalDelays, arrivalLines, people, type Person } from '../data/lobbyPeople'
import { codeSeed, normaliseRoomCode } from '../lib/roomCode'
import { readSession, writeSession, type LobbySession } from '../lib/lobbySession'

/** The space above a settings group, applied inside it so it collapses with it. */
const GROUP_GAP = 'pt-[var(--lobby-gap)]'

const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || '?'

/**
 * The friends lobby. Same diptych as the single-player one — who is playing on
 * the left, what they're playing on the right — with the three things a room
 * full of people needs and a room full of bots doesn't: the code that gets it
 * shared, a chat, and a host who owns the settings everyone else is only
 * shown.
 *
 * Nothing asks for your name until the last possible moment: the gate opens
 * over the lobby, and the lobby itself doesn't mount until it's answered. A
 * pasted invite link therefore behaves exactly like clicking Create at home.
 */
export function MultiLobby() {
  const { code: raw = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const code = normaliseRoomCode(raw)
  const arrived = location.state as Partial<LobbySession> | null

  const [session, setSession] = useState<LobbySession | null>(() => {
    if (arrived?.name) return { name: arrived.name, host: Boolean(arrived.host) }
    return code ? readSession(code) : null
  })

  useEffect(() => {
    if (code && session) writeSession(code, session)
  }, [code, session])

  if (!code) return <Navigate to="/" replace />

  if (!session) {
    return (
      <div className="lobby relative h-[100dvh] overflow-hidden">
        <LobbyPlate />
        <NameGate
          mode="join"
          code={code}
          onSubmit={(name) => setSession({ name, host: false })}
          onCancel={() => navigate('/')}
        />
      </div>
    )
  }

  return <Room key={code} code={code} session={session} />
}

function Room({ code, session }: { code: string; session: LobbySession }) {
  /** What the host of this particular room settled on. The same code always
   *  opens the same draft, so two people typing it in see one lobby. */
  const seed = codeSeed(code)
  const hostName = people[0].name

  const [humans, setHumans] = useState<(Person & { host?: boolean })[]>(() =>
    session.host ? [] : [{ ...people[0], host: true }],
  )

  /** Ids rather than a count, so adding a seat animates only the row that arrived. */
  const nextBotId = useRef(1)
  const [bots, setBots] = useState<number[]>([])

  const [format, setFormat] = useState<string | null>(() =>
    session.host ? null : formats[seed % formats.length].id,
  )
  const [scope, setScope] = useState(() =>
    session.host ? 'top-5' : scopes[(seed >> 3) % scopes.length].id,
  )
  const [league, setLeague] = useState(() =>
    session.host ? 'premier-league' : leagues[(seed >> 6) % leagues.length].id,
  )
  const [nation, setNation] = useState(() =>
    session.host ? 'England' : nations[(seed >> 9) % nations.length],
  )
  const [constraint, setConstraint] = useState(() =>
    session.host ? 'club-1' : constraints[(seed >> 12) % constraints.length].id,
  )
  const [timer, setTimer] = useState(() =>
    session.host ? '15' : timers[(seed >> 15) % timers.length].id,
  )

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 0,
      kind: 'system',
      author: '',
      body: session.host ? 'Lobby opened — share the code.' : `${hostName} opened the lobby.`,
    },
  ])

  const [status, setStatus] = useState('')
  const [statusKey, setStatusKey] = useState(0)

  const report = (message: string) => {
    setStatus(message)
    setStatusKey((key) => key + 1)
  }

  const nextMessageId = useRef(1)
  const say = (message: Omit<Message, 'id'>) => {
    const id = nextMessageId.current
    nextMessageId.current += 1
    setMessages((current) => [...current, { ...message, id }])
  }

  // Read by the arrival timers below, which fire outside a render and so can't
  // see the state directly.
  const occupancy = useRef({ humans: humans.length, bots: 0 })
  useEffect(() => {
    occupancy.current = { humans: humans.length, bots: bots.length }
  }, [humans, bots])

  /**
   * People turn up. There's no server behind this yet, so the lobby plays the
   * arrivals itself — on a stagger, taking real seats, stopping the moment the
   * table is full.
   */
  useEffect(() => {
    const waiting = people.filter((person) => !humans.some((entry) => entry.id === person.id))
    const pending: number[] = []

    waiting.slice(0, arrivalDelays.length).forEach((person, index) => {
      pending.push(
        window.setTimeout(() => {
          const { humans: seated, bots: botCount } = occupancy.current
          if (1 + seated + botCount >= MAX_SEATS) return

          setHumans((current) => [...current, person])
          say({ kind: 'system', author: '', body: `${person.name} joined.` })

          pending.push(
            window.setTimeout(() => {
              say({
                kind: 'said',
                author: person.name,
                body: arrivalLines[index % arrivalLines.length],
              })
            }, CHATTER_DELAY),
          )
        }, arrivalDelays[index]),
      )
    })

    return () => pending.forEach((id) => window.clearTimeout(id))
    // Runs once for the room: the schedule is the room's, not a reaction to it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const you: Seat = {
    id: 'you',
    kind: 'you',
    name: session.name,
    mark: initialOf(session.name),
    note: session.host ? 'Host — sets the draft on the right' : 'At the table',
    tag: session.host ? 'Host' : 'You',
  }

  const humanSeats: Seat[] = humans.map((person) => ({
    id: person.id,
    kind: 'human' as const,
    name: person.name,
    mark: initialOf(person.name),
    note: person.host ? 'Host — sets the draft on the right' : 'At the table',
    tag: person.host ? 'Host' : undefined,
  }))

  const botSeats: Seat[] = bots.map((id, index) => ({
    id: String(id),
    kind: 'bot' as const,
    name: `Bot ${index + 1}`,
    mark: String(index + 1),
    note: 'Default style',
  }))

  // The host sits first because they opened the room; everyone else is in the
  // order they walked in.
  const seats: Seat[] = session.host
    ? [you, ...humanSeats, ...botSeats]
    : [...humanSeats.filter((seat) => seat.tag === 'Host'), you,
       ...humanSeats.filter((seat) => seat.tag !== 'Host'), ...botSeats]

  /** Constraints exist for Free Pick and are not offered anywhere else. */
  const takesConstraint = format === 'free-pick'
  const enoughSeats = seats.length >= MIN_SEATS
  const canStart = session.host && Boolean(format) && enoughSeats

  const resting = session.host
    ? !format
      ? 'Pick a format to start.'
      : !enoughSeats
        ? 'Two at the table to start — invite someone, or add a bot.'
        : ''
    : `Only ${hostName} can change the draft or start it.`

  return (
    <div className="lobby relative flex h-[100dvh] flex-col overflow-hidden md:flex-row">
      {/* ══ Who is playing ══ */}
      <section
        aria-labelledby="room-heading"
        className="fx fx-fade flex min-h-0 shrink-0 flex-col bg-surface px-[clamp(1.1rem,3vw,2.75rem)] py-[var(--lobby-pad-y)] md:h-full md:w-1/2"
      >
        {/* The first thing to go on a short viewport: the strip of discs under
            it already carries the count, and the settings half needs the room. */}
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

        <h1 id="room-heading" className="sr-only">
          Lobby {code}
        </h1>

        <RoomCode code={code} />

        <SeatList
          seats={seats}
          minSeats={1}
          onAdd={
            session.host
              ? () => {
                  const id = nextBotId.current
                  nextBotId.current += 1
                  setBots((current) => [...current, id])
                }
              : undefined
          }
          onRemove={
            session.host
              ? (id) => setBots((current) => current.filter((entry) => String(entry) !== id))
              : undefined
          }
        />

        <LobbyChat
          you={session.name}
          messages={messages}
          onSend={(body) => say({ kind: 'said', author: session.name, body })}
        />
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
            {session.host ? "What you're playing" : `${hostName}'s draft`}
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
            readOnly={!session.host}
            delayMs={260}
          />

          <div className={GROUP_GAP}>
            <ChipGroup
              label="Scope"
              options={scopes}
              value={scope}
              onChange={setScope}
              readOnly={!session.host}
              delayMs={340}
            >
              <ScopeDetail
                scope={scope}
                league={league}
                onLeagueChange={setLeague}
                nation={nation}
                onNationChange={setNation}
                readOnly={!session.host}
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
                readOnly={!session.host}
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
              readOnly={!session.host}
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
            {status || resting}
          </p>

          <div
            className="fx fx-soft mt-[clamp(0.35rem,1.2vh,0.75rem)] flex items-center justify-between gap-4"
            style={{ animationDelay: '600ms' }}
          >
            <Link
              to="/"
              className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted transition-colors duration-150 ease-out hover:text-ink"
            >
              Leave lobby
            </Link>

            <button
              type="button"
              disabled={!canStart}
              onClick={() => report('The draft screen isn’t built yet.')}
              className="shrink-0 rounded-[2px] border border-accent bg-accent px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.5rem,1.6vh,1.125rem)] font-display text-[clamp(0.75rem,1.1vw,0.9375rem)] font-semibold uppercase tracking-[0.1em] text-accent-ink transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-transparent hover:text-accent active:translate-y-px disabled:border-line disabled:bg-transparent disabled:text-faint"
            >
              {session.host ? 'Kick off →' : 'Waiting for the host'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
