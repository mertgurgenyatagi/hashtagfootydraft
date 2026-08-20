import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionBar } from '../components/home/ActionBar'
import { FormatWall } from '../components/home/FormatWall'
import { MessageRow } from '../components/home/MessageRow'
import { Wordmark } from '../components/home/Wordmark'
import { NameGate } from '../components/lobby/NameGate'
import { makeRoomCode, normaliseRoomCode } from '../lib/roomCode'

/**
 * The front door. One viewport, no scroll: a wall of type with the stadium
 * clipped into it, the four single-player formats under it, and the lobby
 * controls along the bottom.
 *
 * Every control on the page goes somewhere now. A format tile opens the
 * single-player lobby on that format; creating a lobby mints a code and
 * joining one takes the code typed into the bar. Both stop at the same gate —
 * a friends lobby needs a name on the seat — and then open the room.
 */
export function Home() {
  const navigate = useNavigate()

  /** Which room the gate is about to open, and whether we're opening it. */
  const [gate, setGate] = useState<{ mode: 'create' | 'join'; code: string } | null>(null)

  return (
    <div className="relative flex h-full flex-col overflow-hidden px-[var(--app-inset-x)] py-[var(--app-inset-y)]">

      <header
        className="fx fx-rise relative z-10 flex items-baseline justify-between gap-6"
        style={{ animationDelay: '80ms' }}
      >
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          A drafting game for people who argue about squads
        </p>
        <p className="tabular hidden shrink-0 font-display text-[10px] font-medium uppercase tracking-[0.2em] text-dim sm:block">
          11 slots · 546 in the pool · 4-2-3-1
        </p>
      </header>

      {/* The wordmark takes whatever room is left over and centres in it; the
          formats stay pinned to the bottom of the block, directly above the
          row that describes them. */}
      {/* Above the bottom block on purpose: the hover shadow down there spreads
          wide enough to reach the tiles, and it has to pass behind them. */}
      <main className="relative z-20 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-center py-[clamp(0.5rem,3cqh,2.25rem)]">
          <div className="flex w-full items-start justify-between gap-8">
            <Wordmark />

            <div
              className="fx fx-rise hidden max-w-[19rem] flex-col gap-2 pt-[clamp(0.25rem,1vh,0.75rem)] sm:flex"
              style={{ animationDelay: '260ms' }}
            >
              <p className="font-display text-[11px] font-medium uppercase tracking-[0.22em] text-accent">
                Draft. Argue. Repeat.
              </p>
              <p className="font-sans text-sm leading-relaxed text-muted">
                Build a 4-2-3-1 out of real footballers, four different ways — auction,
                snake draft, deal-or-no-deal, spin the wheel. Then hold it up next to your
                mates' squads. No stats, no leaderboard, just bragging rights.
              </p>
            </div>
          </div>
        </div>

        {/* The tile picks the format; the lobby opens on it. */}
        <FormatWall onPick={(id) => navigate(`/solo/${id}`)} />
      </main>

      <div className="relative z-10">
        <MessageRow />

        <ActionBar
          onCreate={() => setGate({ mode: 'create', code: makeRoomCode() })}
          onJoin={(code) => setGate({ mode: 'join', code: normaliseRoomCode(code) })}
        />
      </div>

      {gate ? (
        <NameGate
          mode={gate.mode}
          code={gate.code}
          onCancel={() => setGate(null)}
          onSubmit={(name) =>
            navigate(`/lobby/${gate.code}`, {
              state: { name, host: gate.mode === 'create' },
            })
          }
        />
      ) : null}
    </div>
  )
}
