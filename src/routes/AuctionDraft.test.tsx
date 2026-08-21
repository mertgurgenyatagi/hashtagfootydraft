import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Draft } from './Draft'

const CLUBS = ['Arsenal', 'Liverpool', 'Chelsea', 'Everton', 'Barcelona', 'Sevilla']
const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'AMF', 'LW', 'RW', 'ST']

function fixtureCsv() {
  const header =
    'Name,Nation,Age,Club,Position,Current Ability,League,Derived Price (EURm),Opening Bid (EURm)'
  const rows: string[] = []
  for (const position of POSITIONS) {
    CLUBS.forEach((club, index) => {
      rows.push(
        `${position} Player ${index + 1},England,26,${club},${position},${150 - index},Premier Division,${40 + index},30`,
      )
    })
  }
  return [header, ...rows].join('\n')
}

/** Two seats and one bot, so the simulated side of the room is small. */
const DRAFTERS = [
  { id: 'you', name: 'You', kind: 'you' as const, mark: 'M' },
  { id: 'bot-1', name: 'Bot 1', kind: 'bot' as const, mark: '1' },
]

function renderAuction() {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/draft/auction', state: { timer: '15', drafters: DRAFTERS } }]}
    >
      <Routes>
        <Route path="/draft/:formatId" element={<Draft />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuctionDraft', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(fixtureCsv(), { status: 200 })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens a lot with a holder readout rather than a turn', async () => {
    renderAuction()

    // The centre stack, top to bottom: the count, then the bids and the steps.
    expect(await screen.findByText(/^Lot \d+ \/ 30$/)).toBeInTheDocument()
    expect(screen.getByText('Bids')).toBeInTheDocument()
    expect(screen.getByText('Budget')).toBeInTheDocument()

    // Nothing on this screen says whose turn it is, because nothing is.
    expect(screen.queryByText(/your turn/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/is picking/i)).not.toBeInTheDocument()

    // Before anyone has taken it, a lot sits at its opening price and the three
    // increments mask down to one bid-at-opening.
    expect(screen.getByText('Opening')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Bid/ })).toHaveLength(1)
  })

  it('takes your bid at the opening price and hands you the lot', async () => {
    const user = userEvent.setup()
    renderAuction()

    const bid = await screen.findByRole('button', { name: /^Bid/ })
    await user.click(bid)

    // You hold it, so the readout swaps from Opening to Holding and the three
    // real steps come out.
    await waitFor(() => expect(screen.getByText('Holding')).toBeInTheDocument())
    expect(screen.getByText('+5')).toBeInTheDocument()
    expect(screen.getByText('+25')).toBeInTheDocument()

    // Nobody bids against themselves.
    expect(screen.getByRole('button', { name: /\+5/ })).toBeDisabled()
  })

  it('keeps every drafter and the sealed next lot on screen', async () => {
    renderAuction()

    await screen.findByText(/^Lot \d+ \/ 30$/)
    expect(screen.getByRole('tab', { name: 'You' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Bot 1' })).toBeInTheDocument()

    // Nothing previews the queue — the next lot is a number and a question mark.
    expect(screen.getByText(/^\d+ · \?$/)).toBeInTheDocument()
  })
})
