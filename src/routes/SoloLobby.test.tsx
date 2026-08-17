import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SoloLobby } from './SoloLobby'

function renderLobby(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/solo" element={<SoloLobby />} />
        <Route path="/solo/:formatId" element={<SoloLobby />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SoloLobby', () => {
  it('opens on the format the URL carried in', () => {
    renderLobby('/solo/spin-the-wheel')

    expect(screen.getByRole('button', { name: 'Spin the Wheel' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /kick off/i })).toBeEnabled()
  })

  it('picks no format at all when the URL carried none, and says why it cannot start', () => {
    renderLobby('/solo')

    for (const name of ['Auction', 'Deal or No Deal', 'Free Pick', 'Spin the Wheel']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.getByRole('button', { name: /kick off/i })).toBeDisabled()
    expect(screen.getByText(/pick a format to start/i)).toBeInTheDocument()
  })

  it('offers the constraint only for Free Pick', async () => {
    const user = userEvent.setup()
    renderLobby('/solo/auction')

    const constraint = screen.getByRole('button', { name: '1 per club' })
    expect(constraint.closest('[inert]')).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Free Pick' }))
    expect(constraint.closest('[inert]')).toBeNull()
  })

  it('seats two to five, added and removed by hand', async () => {
    const user = userEvent.setup()
    renderLobby('/solo/auction')

    expect(screen.getByText('4 / 5 seats')).toBeInTheDocument()

    // Both renderings are in the DOM under jsdom — the media query that hides
    // one of them isn't applied. The compact strip comes first.
    const [compactAdd] = screen.getAllByRole('button', { name: /add a bot/i })
    await user.click(compactAdd)
    expect(screen.getByText('5 / 5 seats')).toBeInTheDocument()
    // The table is full, so the empty seat row goes with it.
    expect(screen.getAllByRole('button', { name: /add a bot/i })).toHaveLength(1)
    expect(compactAdd).toBeDisabled()

    const removes = screen.getAllByRole('button', { name: 'Remove' })
    expect(removes).toHaveLength(4)
    for (const button of removes) await user.click(button)

    // Never below two at the table, and the last bot can't be removed.
    expect(screen.getByText('2 / 5 seats')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
  })

  it('is an honest dead end at kick off', async () => {
    const user = userEvent.setup()
    renderLobby('/solo/free-pick')

    await user.click(screen.getByRole('button', { name: /kick off/i }))
    expect(screen.getByText(/draft screen isn’t built yet/i)).toBeInTheDocument()
  })
})
