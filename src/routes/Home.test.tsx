import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Home } from './Home'

describe('Home', () => {
  it('shows the wall and stays honest about the dead ends', async () => {
    const user = userEvent.setup()
    render(<Home />)

    expect(screen.getByRole('heading', { name: '#footydraft' })).toBeInTheDocument()
    expect(screen.getByText(/play with friends/i)).toBeInTheDocument()

    // Nothing here has a destination yet, and each control says so.
    const auction = screen.getByRole('button', { name: /auction/i })
    await user.click(auction)
    expect(screen.getByText(/single-player lobby isn't built yet/i)).toBeInTheDocument()

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
