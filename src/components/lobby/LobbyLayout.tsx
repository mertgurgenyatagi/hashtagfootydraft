import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SectionLabel } from '../ui/SectionLabel'
import { StatusLine } from '../ui/StatusLine'

interface LobbyLayoutProps {
  /** Accessible ID for the left column heading */
  leftHeadingId: string
  /** Seat count display, e.g. "4 / 5 seats" */
  seatCountLabel: string
  /** Key to re-trigger seat count animation when changed */
  seatCountKey?: number | string
  /** Content rendered above the seat list (e.g. <h1>Your table</h1> or <RoomCode />) */
  leftHeaderContent: ReactNode
  /** The SeatList component */
  seatList: ReactNode
  /** Bottom content for the left pane (e.g. solo helper note or live chat) */
  leftFooterContent?: ReactNode

  /** Right section header label, e.g. "What you're playing" or "Alex's draft" */
  rightHeaderLabel: string
  /** Chip groups / settings content */
  settingsContent: ReactNode
  /** Message displayed in the polite status line */
  statusMessage: string
  /** Key to trigger status line transition */
  statusKey?: number | string
  /** Back navigation control (e.g. Back to home / Leave lobby) */
  backControl: ReactNode
  /** Primary action button (e.g. Kick off / Waiting for host) */
  actionControl: ReactNode
}

/**
 * Shared Split Studio diptych layout for solo and multiplayer lobbies.
 * Left half: Who is playing (on surface step)
 * Right half: What you're playing (on ground)
 */
export function LobbyLayout({
  leftHeadingId,
  seatCountLabel,
  seatCountKey,
  leftHeaderContent,
  seatList,
  leftFooterContent,
  rightHeaderLabel,
  settingsContent,
  statusMessage,
  statusKey,
  backControl,
  actionControl,
}: LobbyLayoutProps) {
  return (
    <div className="lobby relative flex h-full flex-col overflow-hidden md:flex-row">
      {/* ══ Left Canvas: Who is playing ══ */}
      <section
        aria-labelledby={leftHeadingId}
        className="lobby-half fx fx-fade flex min-h-0 shrink-0 flex-col bg-surface px-[clamp(1.1rem,3vw,2.75rem)] py-[var(--lobby-pad-y)] md:h-full md:w-1/2"
      >
        {/* Top header row — hidden on short viewport where compact strip handles counts */}
        <div
          className="fx fx-soft hidden items-baseline justify-between gap-4 md:flex"
          style={{ animationDelay: '80ms' }}
        >
          <SectionLabel>Who's playing</SectionLabel>
          <span
            key={seatCountKey ?? seatCountLabel}
            className="tabular fx fx-fade shrink-0 font-display text-[11px] font-medium uppercase tracking-[0.1em] text-dim"
          >
            {seatCountLabel}
          </span>
        </div>

        {leftHeaderContent}

        {seatList}

        {leftFooterContent}
      </section>

      {/* ══ Right Canvas: What they're playing ══ */}
      <section
        aria-label="Draft settings"
        className="lobby-half relative flex min-h-0 flex-1 flex-col px-[clamp(1.1rem,3vw,2.75rem)] py-[var(--lobby-pad-y)] md:h-full md:w-1/2 md:flex-none"
      >
        <div
          className="fx fx-soft relative z-10 flex items-baseline justify-between gap-4"
          style={{ animationDelay: '120ms' }}
        >
          <SectionLabel>{rightHeaderLabel}</SectionLabel>
          <Link
            to="/"
            aria-label="#footydraft — back to the home page"
            className="shrink-0 font-wordmark text-[19px] uppercase leading-none tracking-[0.06em] text-ink transition-opacity duration-150 ease-out hover:opacity-70"
          >
            <span className="text-accent">#</span>footydraft
          </Link>
        </div>

        {/* Settings chip groups container */}
        <div className="relative z-10 mt-[var(--lobby-gap)] flex flex-col">
          {settingsContent}
        </div>

        <div className="hidden flex-1 md:block" />

        {/* Footer controls & status line */}
        <div className="relative z-10 mt-[var(--lobby-gap)]">
          <StatusLine message={statusMessage} statusKey={statusKey} />

          <div
            className="fx fx-soft mt-[clamp(0.35rem,1.2vh,0.75rem)] flex items-center justify-between gap-4"
            style={{ animationDelay: '600ms' }}
          >
            {backControl}
            {actionControl}
          </div>
        </div>
      </section>
    </div>
  )
}
