import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Home } from './Home'

/** The lobby itself is exercised in the app, not here — this stub only proves
 *  the entry actions route somewhere real. */
function renderHome() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby/:code" element={<LobbyStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

function LobbyStub() {
  return <p>lobby reached</p>
}

describe('Home', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('gates the entry actions on a nickname, then opens a lobby', async () => {
    const user = userEvent.setup()
    renderHome()

    expect(screen.getByRole('heading', { name: /footydraft/i })).toBeInTheDocument()

    const create = screen.getByRole('button', { name: /create lobby/i })
    expect(create).toBeDisabled()
    expect(screen.getByText(/enter a name to start/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/your name/i), 'Mert')
    expect(create).toBeEnabled()

    await user.click(create)
    expect(await screen.findByText(/lobby reached/i)).toBeInTheDocument()
  })

  it('toggles the join-code panel and gates submission on a full code', async () => {
    const user = userEvent.setup()
    renderHome()

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
    expect(await screen.findByText(/lobby reached/i)).toBeInTheDocument()
  })
})
