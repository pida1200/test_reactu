import { useState, useEffect, useCallback, useMemo } from 'react'
import './App.css'

const API_URL = '/api'
const LIMIT = 200

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('cs-CZ', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

export default function Log() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')
  const [sortCol, setSortCol] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  const loadLog = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/log?limit=${LIMIT}&offset=0`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data) => {
        setItems(data.items || [])
        setTotal(data.total ?? 0)
      })
      .catch((err) => {
        setError(err.message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const id = setTimeout(() => loadLog(), 0)
    return () => clearTimeout(id)
  }, [loadLog])

  const filteredAndSorted = useMemo(() => {
    const f = filter.trim().toLowerCase()
    let list = f
      ? items.filter(
          (r) =>
            (r.username || '').toLowerCase().includes(f) ||
            (r.message || '').toLowerCase().includes(f) ||
            (r.level || '').toLowerCase().includes(f) ||
            (r.detail || '').toLowerCase().includes(f),
        )
      : [...items]
    list.sort((a, b) => {
      let cmp = 0
      if (sortCol === 'createdAt') cmp = new Date(a.createdAt) - new Date(b.createdAt)
      else if (sortCol === 'username') cmp = (a.username || '').localeCompare(b.username || '')
      else if (sortCol === 'level') cmp = (a.level || '').localeCompare(b.level || '')
      else if (sortCol === 'message') cmp = (a.message || '').localeCompare(b.message || '')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [items, filter, sortCol, sortDir])

  const toggleSort = (col) => {
    setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc')
    setSortCol(col)
  }

  return (
    <main className="main main-top app-page--table">
      <div className="main-content main-content-wide">
        <h2 className="page-title">Log aplikace</h2>
        <p className="hint">Aplikační log z databáze.</p>

        <div className="log-toolbar">
          <button type="button" className="btn-yahoo" onClick={loadLog} disabled={loading}>
            Obnovit
          </button>
          <span className="log-meta">Celkem: {total}</span>
          <input
            type="text"
            placeholder="Filtrovat (zpráva, úroveň, detail…)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input log-filter"
          />
        </div>

        {error && <p className="error">Chyba: {error}</p>}
        {loading && <p className="loading">Načítám…</p>}

        {!loading && !error && (
          <div className="table-wrap log-wrap">
            <table className="akcie-table log-table">
              <thead>
                <tr>
                  <th scope="col">
                    <button type="button" className="th-sort" onClick={() => toggleSort('createdAt')}>
                      Čas {sortCol === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th scope="col">
                    <button type="button" className="th-sort" onClick={() => toggleSort('username')}>
                      User {sortCol === 'username' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th scope="col">
                    <button type="button" className="th-sort" onClick={() => toggleSort('level')}>
                      Úroveň {sortCol === 'level' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th scope="col">
                    <button type="button" className="th-sort" onClick={() => toggleSort('message')}>
                      Zpráva {sortCol === 'message' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                  </th>
                  <th scope="col">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="no-data">
                      {items.length === 0 ? 'Žádné záznamy v logu.' : 'Žádné záznamy nevyhovují filtru.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((row) => (
                    <tr key={row.id} className={`log-row log-${row.level}`}>
                      <td className="log-time">{formatDate(row.createdAt)}</td>
                      <td className="log-user">{row.username || '—'}</td>
                      <td className="log-level">{row.level}</td>
                      <td className="log-message">{row.message}</td>
                      <td className="log-detail">{row.detail ?? '—'}</td>
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
