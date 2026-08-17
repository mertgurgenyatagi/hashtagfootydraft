/**
 * Titles the bar underneath it. Used to swap in a format's description on
 * hover; that's gone now, so it's just the static title.
 */
export function MessageRow() {
  return (
    <div className="mt-[clamp(0.75rem,4vh,2.75rem)] flex h-[clamp(2.25rem,5vh,3.5rem)] items-center">
      <p
        className="fx fx-rise font-display text-[11px] font-medium uppercase tracking-[0.22em] text-accent"
        style={{ animationDelay: '1060ms' }}
      >
        Play with friends
      </p>
    </div>
  )
}
