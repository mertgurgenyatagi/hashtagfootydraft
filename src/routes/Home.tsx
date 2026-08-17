import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntryPanel } from '../components/home/EntryPanel'
import { PlayerMarquee } from '../components/home/PlayerMarquee'
import { StadiumBackdrop } from '../components/home/StadiumBackdrop'
import { Wordmark } from '../components/home/Wordmark'

const NAME_STORAGE_KEY = 'footydraft.name'

/** The four formats from PROJECT.md. With no nav and no scrolling, this strip is
 *  the only thing telling a first-time visitor what the game actually is. */
const FORMATS = ['Auction', 'Deal or No Deal', 'Free Pick', 'Spin the Wheel']

/** No I/O/0/1 — these get read aloud and typed in by hand. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function readStoredName(): string {
  try {
    return localStorage.getItem(NAME_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function newLobbyCode(): string {
  let code = ''
  for (let index = 0; index < 4; index += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
  }
  return `FD-${code}`
}

export function Home() {
  const [name, setName] = useState(readStoredName)
  const navigate = useNavigate()

  useEffect(() => {
    try {
      localStorage.setItem(NAME_STORAGE_KEY, name)
    } catch {
      // Private browsing can refuse writes. A forgotten nickname isn't worth failing over.
    }
  }, [name])

  return (
    // minmax(0,1fr) column: without it the marquee's max-content track inflates
    // the implicit column and drags this whole stack off-screen.
    <div className="grid h-[100dvh] grid-cols-[minmax(0,1fr)] grid-rows-[1fr_auto] overflow-hidden">
      {/* Fixed, so it sits outside the grid's flow rather than claiming a row. */}
      <StadiumBackdrop />

      <main className="flex min-h-0 w-full flex-col items-center justify-center px-6 text-center">
        <div className="rise">
          <Wordmark />
        </div>

        <p
          className="rise mt-4 max-w-[44ch] text-balance text-[clamp(0.92rem,1.5vw,1.05rem)] leading-relaxed text-muted"
          style={{ animationDelay: '60ms' }}
        >
          {/* Two blocks, not one wrapped sentence: left to itself the line broke
              after "No", which reads as a typo. */}
          <span className="block text-balance">Draft football&rsquo;s best with your friends.</span>
          <span className="block text-balance">
            No scores, no table &mdash; just the eleven you picked.
          </span>
        </p>

        <div
          className="rise mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1 font-display text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted sm:gap-x-3"
          style={{ animationDelay: '120ms' }}
        >
          {FORMATS.map((format, index) => (
            <Fragment key={format}>
              {/* Separators are dropped below sm, where wrapping would otherwise
                  strand a slash at the end of a line. Spacing carries it instead. */}
              {index > 0 && (
                <span aria-hidden="true" className="hidden text-line sm:inline">
                  /
                </span>
              )}
              <span>{format}</span>
            </Fragment>
          ))}
        </div>

        <div className="rise mt-8 w-full max-w-[26rem]" style={{ animationDelay: '180ms' }}>
          <EntryPanel
            name={name}
            onNameChange={setName}
            onCreate={() => navigate(`/lobby/${newLobbyCode()}`)}
            // Solo lands in the same lobby — bots are added by hand there, the
            // same way a human would be invited.
            onSolo={() => navigate(`/lobby/${newLobbyCode()}`)}
            onJoin={(code) => navigate(`/lobby/${code}`)}
          />
        </div>

        <p className="mt-3 h-6 text-[0.75rem] text-muted">
          Lobbies are invite-link only — there&rsquo;s nothing to browse.
        </p>
      </main>

      <PlayerMarquee />
    </div>
  )
}
