import { useState } from 'react'
import { ActionBar } from '../components/home/ActionBar'
import { FormatWall } from '../components/home/FormatWall'
import { MessageRow } from '../components/home/MessageRow'
import { StadiumPlate } from '../components/home/StadiumPlate'
import { Wordmark } from '../components/home/Wordmark'
import { formats } from '../data/formats'

/**
 * The whole site, for now. One viewport, no scroll, no other route: a wall of
 * type with the stadium clipped into it, the four single-player formats under
 * it, and the lobby controls along the bottom.
 *
 * Every action here is an honest dead end — the lobby isn't built and nothing
 * is wired to Firebase, so each one says so in the status line instead of
 * faking a destination.
 */
export function Home() {
  const [status, setStatus] = useState('')
  /** Bumped on every status change so the line re-animates even when the text
   *  it lands on happens to be identical. */
  const [statusKey, setStatusKey] = useState(0)

  const report = (message: string) => {
    setStatus(message)
    setStatusKey((key) => key + 1)
  }

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden px-[clamp(1.25rem,4vw,3.5rem)] pb-[clamp(1.25rem,3vh,2.25rem)] pt-[clamp(1.25rem,3vh,2.5rem)]">
      <StadiumPlate />

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
        <div className="flex min-h-0 flex-1 items-center py-[clamp(0.5rem,3vh,2.25rem)]">
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

        <FormatWall
          onPick={(id) => {
            const format = formats.find((entry) => entry.id === id)
            report(`${format?.name} — the single-player lobby isn't built yet.`)
          }}
        />
      </main>

      <div className="relative z-10">
        <MessageRow />

        <ActionBar
          onCreate={() => report("Lobbies aren't wired up yet — there's nothing to create.")}
          onJoin={() => report('No lobby to join yet — a room code goes nowhere.')}
        />

        {/* Fixed height: the line has to be able to appear without shunting the
            bar it sits under. */}
        <p
          key={statusKey}
          aria-live="polite"
          className="fx fx-fade mt-[clamp(0.4rem,1.2vh,0.75rem)] h-5 truncate text-[12px] leading-5 text-muted"
        >
          {status}
        </p>
      </div>
    </div>
  )
}
