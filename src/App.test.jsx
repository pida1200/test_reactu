import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

const mockFetch = () => {
  const res = { ok: true, json: async () => [] }
  return Promise.resolve(res)
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(mockFetch))
  })

  it('vykreslí hlavičku s výběrem data', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByLabelText(/Datum:/i)).toBeInTheDocument()
  })

  it('po načtení zobrazí pole pro filtrování', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByPlaceholderText(/Filtrovat/i)).toBeInTheDocument()
  })
})
