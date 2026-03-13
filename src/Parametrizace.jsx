import { useState, useEffect, useCallback, useMemo } from 'react'
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
  const [doplnovani, setDoplnovani] = useState(false)
  const [filter, setFilter] = useState('')
  const [sortCol, setSortCol] = useState('nazev')
  const [sortDir, setSortDir] = useState('asc')

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

  const handleDoplnitVychozi = () => {
    setDoplnovani(true)
    setError(null)
    fetch(`${API_URL}/akcie/doplnit-vychozi`, { method: 'POST' })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || res.statusText)))
        return res.json()
      })
      .then(() => loadParametrizace())
      .catch((err) => setError(err.message))
      .finally(() => setDoplnovani(false))
  }

  const filteredAndSorted = useMemo(() => {
    const f = filter.trim().toLowerCase()
    let list = f ? seznam.filter((r) => (r.nazev || '').toLowerCase().includes(f) || (r.yahooSymbol || '').toLowerCase().includes(f)) : [...seznam]
    const col = sortCol === 'nazev' ? 'nazev' : 'yahooSymbol'
    list.sort((a, b) => {
      const cmp = (a[col] || '').localeCompare(b[col] || '')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [seznam, filter, sortCol, sortDir])

  const toggleSort = (col) => {
    setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc')
    setSortCol(col)
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
    <main className="main main-top">
      <div className="main-content main-content-wide">
        <h2 className="page-title">Parametrizace akcií</h2>
        <p className="hint">Názvy akcií a odpovídající symboly Yahoo Finance (např. CEZ.PR, KOMB.PR). Tyto údaje se používají pro načítání kurzů na stránce Přehled.</p>

        <div className="param-form" style={{ marginBottom: '0.5rem' }}>
          <button
            type="button"
            className="btn-yahoo"
            disabled={doplnovani}
            onClick={handleDoplnitVychozi}
          >
            {doplnovani ? 'Doplňuji…' : 'Doplnit výchozí akcie (ČEZ, Moneta, Colt CZ, …)'}
          </button>
        </div>

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
          <>
            <div className="table-toolbar">
              <input
                type="text"
                placeholder="Filtrovat (název, symbol…)"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="table-wrap">
              <table className="akcie-table">
                <thead>
                  <tr>
                    <th scope="col">
                      <button type="button" className="th-sort" onClick={() => toggleSort('nazev')}>
                        Název {sortCol === 'nazev' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th scope="col">
                      <button type="button" className="th-sort" onClick={() => toggleSort('yahooSymbol')}>
                        Yahoo symbol {sortCol === 'yahooSymbol' && (sortDir === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th scope="col">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="no-data">
                        {seznam.length === 0 ? 'Žádné záznamy. Přidej první akcii výše.' : 'Žádné záznamy nevyhovují filtru.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSorted.map((row) => (
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
          </>
        )}
      </div>
    </main>
  )
}
