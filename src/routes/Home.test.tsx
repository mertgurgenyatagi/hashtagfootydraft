import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Home } from './Home'

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solo/:formatId" element={<p>lobby route</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Home', () => {
  it('shows the wall and opens the lobby on the format that was picked', async () => {
    const user = userEvent.setup()
    renderHome()

    expect(screen.getByRole('heading', { name: '#footydraft' })).toBeInTheDocument()
    expect(screen.getByText(/play with friends/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /auction/i }))
    expect(screen.getByText('lobby route')).toBeInTheDocument()
  })

  it('stays honest about the dead ends that are still dead ends', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(screen.getByRole('button', { name: /create a lobby/i }))
    expect(screen.getByText(/nothing to create/i)).toBeInTheDocument()

    // Joining is gated on a code long enough to be one.
    const join = screen.getByRole('button', { name: /join lobby/i })
    expect(join).toBeDisabled()
    await user.type(screen.getByLabelText(/room code/i), 'fd-24')
    expect(join).toBeEnabled()
    await user.click(join)
    expect(screen.getByText(/room code goes nowhere/i)).toBeInTheDocument()
  })
})
