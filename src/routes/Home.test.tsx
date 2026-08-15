import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Home } from './Home'

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('gates the entry actions on a nickname and is honest about dead ends', async () => {
    const user = userEvent.setup()
    render(<Home />)

    expect(screen.getByRole('heading', { name: /footydraft/i })).toBeInTheDocument()

    const create = screen.getByRole('button', { name: /create lobby/i })
    expect(create).toBeDisabled()
    expect(screen.getByText(/enter a name to start/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/your name/i), 'Mert')
    expect(create).toBeEnabled()

    await user.click(create)
    expect(await screen.findByText(/lobby screen isn.t built yet/i)).toBeInTheDocument()
  })

  it('toggles the join-code panel and gates submission on a full code', async () => {
    const user = userEvent.setup()
    render(<Home />)

    const toggle = screen.getByRole('button', { name: /join code/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const submit = screen.getByRole('button', { name: /^join$/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/lobby code/i), 'abc12')
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/lobby code/i), '3')
    expect(submit).toBeEnabled()

    await user.click(submit)
    expect(await screen.findByText(/lobby ABC123 isn.t wired up yet/i)).toBeInTheDocument()
  })
})
