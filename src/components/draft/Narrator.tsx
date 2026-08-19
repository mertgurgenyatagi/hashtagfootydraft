export type NarratorTone = 'you' | 'waiting' | 'settled'

interface NarratorProps {
  text: string
  tone: NarratorTone
  /** Changes whenever the line does, so the fade re-runs on an identical string. */
  beat: number
}

/**
 * The band across the top that says what is happening.
 *
 * It reports and nothing else — who is on the clock, what they took, when the
 * round turned over. It is not a commentator and has no voice: there is no
 * banter, no exclamation, no second-person enthusiasm. A drafter who looks away
 * for ten seconds should be able to look back at this one line and know exactly
 * where the draft is.
 */
export function Narrator({ text, tone, beat }: NarratorProps) {
  return (
    <p
      aria-live="polite"
      className="flex min-w-0 items-center gap-[11px]"
    >
      <span
        aria-hidden="true"
        className={[
          'h-[7px] w-[7px] shrink-0 rounded-full',
          tone === 'you'
            ? 'bg-accent'
            : tone === 'waiting'
              ? 'bg-muted narrator-pulse'
              : 'bg-line-strong',
        ].join(' ')}
      />
      <span
        key={beat}
        className={[
          'fx fx-soft truncate font-display text-[13.5px] font-medium uppercase tracking-[0.07em]',
          tone === 'you' ? 'text-accent' : 'text-ink',
        ].join(' ')}
      >
        {text}
      </span>
    </p>
  )
}
