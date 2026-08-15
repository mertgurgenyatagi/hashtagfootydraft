import { useEffect, useRef } from 'react'
import { Button } from '../ui/Button'

export const JOIN_CODE_LENGTH = 6

interface JoinCodePanelProps {
  open: boolean
  code: string
  onCodeChange: (code: string) => void
  onSubmit: () => void
}

/**
 * Expands via grid-template-rows 0fr -> 1fr, which animates to auto height
 * without measuring anything in JavaScript.
 */
export function JoinCodePanel({ open, code, onCodeChange, onSubmit }: JoinCodePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const complete = code.length === JOIN_CODE_LENGTH

  return (
    <div
      className={`grid transition-[grid-template-rows] duration-200 ease-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <form
          className="flex gap-2 pt-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (complete) onSubmit()
          }}
        >
          <input
            ref={inputRef}
            value={code}
            onChange={(event) =>
              onCodeChange(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, JOIN_CODE_LENGTH),
              )
            }
            placeholder="ABC123"
            aria-label="Lobby code"
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            tabIndex={open ? undefined : -1}
            className="tabular min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center font-display text-[1.05rem] font-medium uppercase tracking-[0.35em] text-ink placeholder:tracking-[0.35em] placeholder:text-muted/45 focus:border-accent focus:outline-none"
          />
          <Button type="submit" disabled={!complete} tabIndex={open ? undefined : -1}>
            Join
          </Button>
        </form>
      </div>
    </div>
  )
}
