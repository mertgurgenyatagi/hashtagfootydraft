import type { ReactNode } from 'react'
import { AmbientBackdrop } from './AmbientBackdrop'

/**
 * Top-level application shell.
 *
 * Provides continuous ambient backdrop persistence, fixed 100dvh viewport boundaries,
 * and unified zero-scroll containment across all routes.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ground text-ink select-none">
      <AmbientBackdrop />
      <div className="relative z-10 h-full w-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}
