import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { LobbyBackdrop } from '../components/lobby/LobbyBackdrop'
import { Button } from '../components/ui/Button'

/** Layout 16 ("seat strip") over layout 20's full-bleed stadium: drafters
 *  compress into a strip along the top so the body has room to say what each
 *  format actually is — which is the thing a first-time player needs most, since
 *  the four formats play nothing like each other.
 *
 *  Nothing here is wired to Firebase. State is local and dies with the tab; the
 *  screen exists so the shape can be judged in the real app. */

const NAME_STORAGE_KEY = 'footydraft.name'
const MAX_SEATS = 5

const FORMATS = [
  {
    name: 'Auction',
    blurb: 'Live bidding, unlimited graveyard, blocking allowed. Empty slots backfill at the end.',
  },
  {
    name: 'Deal or No Deal',
    blurb: 'Eleven rounds, one position each. Stick with the boxes or hear the offer.',
  },
  {
    name: 'Free Pick',
    blurb: 'Snake draft, take anyone. The only format that supports constraints.',
  },
  {
    name: 'Spin the Wheel',
    blurb: 'One category all draft — club, league or nation — spun before every pick.',
  },
] as const

type FormatName = (typeof FORMATS)[number]['name']

const SCOPES = ['Top 5 Leagues', 'All players', 'One league', 'One nation']
const TIMERS = ['15s', '30s', '60s', 'Off']
const CONSTRAINTS = ['1 / club', '3 / club', '1 / nation', '3 / nation']

/** Bots are always added by hand, never auto-filled, so this is just a name
 *  supply — the lobby never reaches for one on its own. */
const BOT_NAMES = ['Ada', 'Nero', 'Bruno', 'Kaz']

const LABEL = 'font-display text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted'
const GLASS = 'border border-line/90 bg-surface/70 backdrop-blur-md'
const TAG =
  'font-display text-[0.56rem] font-medium uppercase tracking-[0.16em] rounded-[3px] border border-line px-1.5 py-[3px] text-muted'

interface Seat {
  id: number
  name: string
  kind: 'host' | 'bot'
}

interface Message {
  id: number
  author: string
  body: string
  system?: boolean
}

function readStoredName(): string {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) || 'You'
  } catch {
    return 'You'
  }
}

export function Lobby() {
  const { code = 'FD-7K2Q' } = useParams()
  const you = readStoredName()

  const [seats, setSeats] = useState<Seat[]>([{ id: 0, name: you, kind: 'host' }])
  const [format, setFormat] = useState<FormatName>('Auction')
  const [scope, setScope] = useState(SCOPES[0])
  const [timer, setTimer] = useState(TIMERS[0])
  const [constraint, setConstraint] = useState(CONSTRAINTS[0])
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState('')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, author: '—', body: 'You created the lobby. Send the link to whoever’s playing.', system: true },
  ])

  const log = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  // Constraints exist for Free Pick alone — the setting isn't offered elsewhere,
  // rather than being shown and silently ignored.
  const constraintsAllowed = format === 'Free Pick'
  const inviteLink = `${window.location.origin}${window.location.pathname}#/lobby/${code}`

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight })
  }, [messages])

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])

  function addBot() {
    if (seats.length >= MAX_SEATS) return
    const taken = new Set(seats.map((seat) => seat.name))
    const name = BOT_NAMES.find((candidate) => !taken.has(candidate)) ?? 'Bot'
    setSeats([...seats, { id: nextId.current++, name, kind: 'bot' }])
    say(`${name} was added as a bot.`, true)
  }

  function removeSeat(id: number) {
    const seat = seats.find((candidate) => candidate.id === id)
    setSeats(seats.filter((candidate) => candidate.id !== id))
    if (seat) say(`${seat.name} left the lobby.`, true)
  }

  function say(body: string, system = false) {
    setMessages((current) => [
      ...current,
      { id: nextId.current++, author: system ? '—' : you, body, system },
    ])
  }

  function send(event: FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    say(body)
    setDraft('')
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
    } catch {
      setStatus('Couldn’t reach the clipboard — the code is up in the corner.')
    }
  }

  const empty = MAX_SEATS - seats.length

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <LobbyBackdrop />

      {/* ---- the seat strip ---- */}
      <header className={`flex shrink-0 items-stretch gap-3 px-6 py-4 ${GLASS} border-x-0 border-t-0`}>
        <div className="flex w-[11.5rem] shrink-0 flex-col justify-center gap-1">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-xl font-semibold text-accent">#</span>
            <span className="font-display font-medium uppercase tracking-[0.09em]">footydraft</span>
          </div>
          <span className="font-display text-[0.95rem] font-medium tracking-[0.28em] tabular">
            {code}
          </span>
          <button
            onClick={copyInvite}
            className={`${TAG} mt-1 self-start ${copied ? 'border-live/40 text-live' : 'border-accent/45 text-accent'}`}
          >
            {copied ? 'Link copied' : 'Copy invite'}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 gap-3">
          {seats.map((seat) => (
            <div
              key={seat.id}
              className={`flex min-w-0 flex-1 items-center gap-3 border p-3.5 ${
                seat.kind === 'host' ? 'border-accent bg-surface/70' : 'border-line bg-surface/55'
              }`}
            >
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full font-display text-[0.95rem] font-semibold ${
                  seat.kind === 'host'
                    ? 'border border-accent bg-accent text-accent-ink'
                    : 'border border-dashed border-line bg-[#232d25] text-muted'
                }`}
              >
                {seat.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-display text-[1.05rem] font-medium uppercase tracking-[0.04em]">
                  {seat.name}
                </span>
                <span className={LABEL}>{seat.kind === 'host' ? 'Host · you' : 'Bot'}</span>
              </div>
              {seat.kind === 'bot' && (
                <button onClick={() => removeSeat(seat.id)} className={`${TAG} ml-auto hover:text-ink`}>
                  Remove
                </button>
              )}
            </div>
          ))}

          {Array.from({ length: empty }, (_, index) => (
            <button
              key={`empty-${index}`}
              onClick={addBot}
              className="flex min-w-0 flex-1 items-center gap-3 border border-dashed border-line p-3.5 opacity-55 transition hover:opacity-100"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-line font-display text-[0.95rem] text-muted">
                +
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 text-left">
                <span className="truncate font-display text-[1.05rem] font-medium uppercase tracking-[0.04em] text-muted">
                  Add bot
                </span>
                <span className={LABEL}>Seat {seats.length + index + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </header>

      {/* ---- the setup ---- */}
      {/* Centred in whatever height is left: on a tall viewport the strip and the
          footer pin to the edges, and this shouldn't strand itself up top. */}
      <main className="flex min-h-0 flex-1 flex-col justify-center gap-7 px-6 py-6">
        <section>
          <p className={LABEL}>Pick the game — host only</p>
          <div className="mt-3.5 grid grid-cols-4 gap-3.5">
            {FORMATS.map((entry) => {
              const on = entry.name === format
              return (
                <button
                  key={entry.name}
                  onClick={() => setFormat(entry.name)}
                  className={`relative flex flex-col gap-2.5 border p-5 text-left backdrop-blur-md transition ${
                    on ? 'border-accent bg-surface/75' : 'border-line bg-surface/55 hover:border-ink/25'
                  }`}
                >
                  {on && <span className="absolute right-4 top-4 size-3 rounded-full bg-accent" />}
                  <span className="font-display text-[clamp(1.15rem,1.7vw,1.6rem)] font-medium uppercase tracking-[0.03em]">
                    {entry.name}
                  </span>
                  <span className="text-[0.78rem] leading-relaxed text-muted">{entry.blurb}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="flex flex-wrap items-start gap-x-12 gap-y-6">
          <div className="flex flex-col gap-3">
            <span className={LABEL}>Scope</span>
            <Segmented options={SCOPES} value={scope} onChange={setScope} />
          </div>

          <div className="flex flex-col gap-3">
            <span className={LABEL}>Bid timer</span>
            <Segmented options={TIMERS} value={timer} onChange={setTimer} />
          </div>

          {/* Not hidden outright: a visible, reasoned dead end beats a control
              that quietly vanishes when you change format. */}
          <div className={`flex flex-col gap-3 ${constraintsAllowed ? '' : 'opacity-40'}`}>
            <span className={LABEL}>Constraint</span>
            <Segmented
              options={CONSTRAINTS}
              value={constraint}
              onChange={setConstraint}
              disabled={!constraintsAllowed}
            />
            {!constraintsAllowed && (
              <span className="text-[0.72rem] text-muted">
                Free Pick only — {format} can’t use constraints.
              </span>
            )}
          </div>
        </section>
      </main>

      {/* ---- chat, and the one button that matters ---- */}
      <footer className="flex shrink-0 items-end justify-between gap-6 px-6 pb-6">
        <div className={`flex h-[10.5rem] w-[27rem] flex-col gap-2.5 p-4 ${GLASS}`}>
          <div className="flex items-center justify-between">
            <span className={LABEL}>Chat</span>
            <span className={`${TAG} border-live/40 text-live`}>Live</span>
          </div>

          {/* The only scroll region on a screen that otherwise never scrolls. */}
          <div
            ref={log}
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 [scrollbar-color:var(--color-line)_transparent] [scrollbar-width:thin]"
          >
            {messages.map((message) => (
              <p
                key={message.id}
                className={`text-[0.78rem] leading-snug ${message.system ? 'italic text-muted' : ''}`}
              >
                <span
                  className={`mr-1.5 font-display text-[0.62rem] font-medium uppercase not-italic tracking-[0.1em] ${
                    message.system ? 'text-muted' : 'text-accent'
                  }`}
                >
                  {message.author}
                </span>
                {message.body}
              </p>
            ))}
          </div>

          <form onSubmit={send}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Say something…"
              className="w-full rounded-md border border-line bg-black/25 px-3 py-2 text-[0.8rem] text-ink placeholder:text-muted focus:border-accent/60 focus:outline-none"
            />
          </form>
        </div>

        <div className="flex flex-col items-end gap-3">
          <p aria-live="polite" className="h-4 text-[0.75rem] text-muted">
            {status ||
              (seats.length < 2
                ? 'A draft needs at least two drafters — add a bot or send the link.'
                : 'Nothing carries over from a previous draft. Clean slate.')}
          </p>
          <Button
            disabled={seats.length < 2}
            onClick={() =>
              setStatus(
                `${format} isn’t built yet — this pass is the lobby. Setup captured: ${scope}, ${timer} timer.`,
              )
            }
            className="px-14 py-5 text-[1.05rem]"
          >
            Start draft
          </Button>
        </div>
      </footer>
    </div>
  )
}

/** A pill of mutually exclusive options. Disabled as a whole rather than per
 *  option — the reason lives next to it, not inside it. */
function Segmented({
  options,
  value,
  onChange,
  disabled = false,
}: {
  options: string[]
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-line">
      {options.map((option) => (
        <button
          key={option}
          disabled={disabled}
          onClick={() => onChange(option)}
          className={`font-display px-4 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] transition ${
            option === value ? 'bg-accent text-accent-ink' : 'text-muted hover:text-ink'
          } ${disabled ? 'hover:text-muted' : ''}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
