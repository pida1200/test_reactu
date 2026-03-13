import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API_URL = '/api'

export default function Parametrizace() {
  const [seznam, setSeznam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [nazev, setNazev] = useState('')
  const [yahooSymbol, setYahooSymbol] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadParametrizace = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/akcie/parametrizace`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(setSeznam)
      .catch((err) => {
        setError(err.message)
        setSeznam([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const id = setTimeout(() => loadParametrizace(), 0)
    return () => clearTimeout(id)
  }, [loadParametrizace])

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = nazev.trim()
    const y = yahooSymbol.trim()
    if (!n || !y) return
    setSaving(true)
    setError(null)
    const url = editingId ? `${API_URL}/akcie/parametrizace/${editingId}` : `${API_URL}/akcie/parametrizace`
    const method = editingId ? 'PUT' : 'POST'
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nazev: n, yahooSymbol: y }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || res.statusText)))
        return res.json()
      })
      .then(() => {
        setNazev('')
        setYahooSymbol('')
        setEditingId(null)
        loadParametrizace()
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false))
  }

  const handleEdit = (row) => {
    setEditingId(row.id)
    setNazev(row.nazev)
    setYahooSymbol(row.yahooSymbol)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setNazev('')
    setYahooSymbol('')
  }

  const handleDelete = (id) => {
    if (!window.confirm('Opravdu smazat tento záznam?')) return
    setSaving(true)
    setError(null)
    fetch(`${API_URL}/akcie/parametrizace/${id}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || res.statusText)))
        loadParametrizace()
      })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false))
  }

  return (
    <main className="main">
      <div className="main-content main-content-wide">
        <h2 className="page-title">Parametrizace akcií</h2>
        <p className="hint">Názvy akcií a odpovídající symboly Yahoo Finance (např. CEZ.PR, KOMB.PR). Tyto údaje se používají pro načítání kurzů na stránce Přehled.</p>

        <form onSubmit={handleSubmit} className="param-form">
          <input
            type="text"
            placeholder="Název akcie"
            value={nazev}
            onChange={(e) => setNazev(e.target.value)}
            className="param-input"
            required
          />
          <input
            type="text"
            placeholder="Yahoo symbol (např. CEZ.PR)"
            value={yahooSymbol}
            onChange={(e) => setYahooSymbol(e.target.value)}
            className="param-input"
            required
          />
          <div className="param-actions">
            <button type="submit" className="btn-yahoo" disabled={saving}>
              {editingId ? 'Uložit změny' : 'Přidat'}
            </button>
            {editingId && (
              <button type="button" className="btn-yahoo btn-secondary" onClick={handleCancelEdit} disabled={saving}>
                Zrušit
              </button>
            )}
          </div>
        </form>

        {error && <p className="error">Chyba: {error}</p>}
        {loading && <p className="loading">Načítám…</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="akcie-table">
              <thead>
                <tr>
                  <th scope="col">Název</th>
                  <th scope="col">Yahoo symbol</th>
                  <th scope="col">Akce</th>
                </tr>
              </thead>
              <tbody>
                {seznam.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="no-data">
                      Žádné záznamy. Přidej první akcii výše.
                    </td>
                  </tr>
                ) : (
                  seznam.map((row) => (
                    <tr key={row.id}>
                      <td>{row.nazev}</td>
                      <td><code>{row.yahooSymbol}</code></td>
                      <td className="td-button">
                        <button
                          type="button"
                          className="btn-yahoo btn-small"
                          onClick={() => handleEdit(row)}
                          disabled={saving}
                        >
                          Upravit
                        </button>
                        <button
                          type="button"
                          className="btn-yahoo btn-small btn-danger"
                          onClick={() => handleDelete(row.id)}
                          disabled={saving}
                        >
                          Smazat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
