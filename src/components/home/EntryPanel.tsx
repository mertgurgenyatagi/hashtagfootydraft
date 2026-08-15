import { useState } from 'react'
import { Button } from '../ui/Button'
import { JOIN_CODE_LENGTH, JoinCodePanel } from './JoinCodePanel'

export const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 16

interface EntryPanelProps {
  name: string
  onNameChange: (name: string) => void
  onCreate: () => void
  onSolo: () => void
  onJoin: (code: string) => void
}

export function EntryPanel({ name, onNameChange, onCreate, onSolo, onJoin }: EntryPanelProps) {
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const named = name.trim().length >= MIN_NAME_LENGTH

  return (
    <div className="w-full">
      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value.slice(0, MAX_NAME_LENGTH))}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && named) onCreate()
        }}
        placeholder="your name"
        aria-label="Your name"
        aria-describedby="name-help"
        autoComplete="off"
        spellCheck={false}
        maxLength={MAX_NAME_LENGTH}
        className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-center text-[1.02rem] text-ink transition-colors duration-150 placeholder:text-muted/55 focus:border-accent focus:outline-none"
      />

      {/* Fixed height: the helper appearing and vanishing must not move the buttons. */}
      <p id="name-help" className="mt-2 h-4 text-[0.75rem] text-muted">
        {named ? '' : 'Enter a name to start — two characters is enough.'}
      </p>

      <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={onCreate} disabled={!named} className="sm:flex-1">
          Create lobby
        </Button>
        <Button
          variant="ghost"
          onClick={() => setJoinOpen((open) => !open)}
          aria-expanded={joinOpen}
          className="sm:flex-1"
        >
          Join code
        </Button>
      </div>

      <JoinCodePanel
        open={joinOpen}
        code={joinCode}
        onCodeChange={setJoinCode}
        onSubmit={() => onJoin(joinCode)}
      />

      <div className="mt-4">
        <Button variant="quiet" onClick={onSolo} disabled={!named}>
          Play solo <span aria-hidden="true">→</span>
        </Button>
      </div>

      <span className="sr-only">Lobby codes are {JOIN_CODE_LENGTH} characters.</span>
    </div>
  )
}
