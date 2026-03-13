import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { isNetworkError, parseZmena } from './utils.js'
import './App.css'

const API_URL = '/api'

function App() {
  const navigate = useNavigate()
  const [datum, setDatum] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [akcie, setAkcie] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingYahooAll, setLoadingYahooAll] = useState(false)
  const [symboly, setSymboly] = useState([])
  const [filter, setFilter] = useState('')
  const [sortCol, setSortCol] = useState('akcie')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => {
    fetch(`${API_URL}/akcie/symboly`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSymboly)
      .catch(() => setSymboly([]))
  }, [])

  const loadAkcie = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${API_URL}/akcie?datum=${datum}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then((data) => setAkcie(data))
      .catch((err) => {
        setError(err.message)
        setAkcie([])
      })
      .finally(() => setLoading(false))
  }, [datum])

  useEffect(() => {
    const id = setTimeout(() => loadAkcie(), 0)
    return () => clearTimeout(id)
  }, [loadAkcie])

  const handleNačístVšechnyYahoo = () => {
    setLoadingYahooAll(true)
    setError(null)
    fetch(`${API_URL}/akcie/fetch-yahoo-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ datum }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || res.statusText)))
        return res.json()
      })
      .then((data) => {
        loadAkcie()
        if (data.failedList?.length > 0) {
          setError(`Uloženo ${data.saved} akcií. Nepodařilo se: ${data.failedList.map((f) => `${f.nazev} (${f.reason})`).join(', ')}`)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingYahooAll(false))
  }

  const filteredAndSorted = useMemo(() => {
    let list = akcie
    const f = filter.trim().toLowerCase()
    if (f) {
      list = list.filter((r) => r.akcie?.toLowerCase().includes(f) || String(r.hodnotaCzk).includes(f) || (r.zmena && r.zmena.toLowerCase().includes(f)))
    }
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortCol === 'akcie') cmp = (a.akcie || '').localeCompare(b.akcie || '')
      else if (sortCol === 'hodnota') cmp = Number(a.hodnotaCzk) - Number(b.hodnotaCzk)
      else if (sortCol === 'zmena') {
        const va = parseZmena(a.zmena) ?? -Infinity
        const vb = parseZmena(b.zmena) ?? -Infinity
        cmp = va - vb
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [akcie, filter, sortCol, sortDir])

  const toggleSort = (col) => {
    setSortDir(sortCol === col && sortDir === 'asc' ? 'desc' : 'asc')
    setSortCol(col)
  }

  return (
    <main className="main main-top">
      <div className="main-content">
        <div className="toolbar-row">
          <div className="date-picker-wrap">
            <label htmlFor="datum">Datum:</label>
            <input
              id="datum"
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="date-input"
            />
          </div>
          {symboly.length > 0 && (
            <button
              type="button"
              className="btn-yahoo btn-load-all"
              disabled={loadingYahooAll}
              onClick={handleNačístVšechnyYahoo}
            >
              {loadingYahooAll ? 'Načítám…' : 'Načíst kurzy všech akcií z Yahoo'}
            </button>
          )}
        </div>

        {error && (
          <p className="error">
            Chyba: {error}
            {isNetworkError(error) && (
              <span className="error-hint">
                {' '}
                Spusť nejdřív API: v terminálu <code>npm run server</code>, pak v druhém <code>npm run dev</code> a otevři http://localhost:5173
              </span>
            )}
          </p>
        )}
        {loading && <p className="loading">Načítám…</p>}

        {!loading && !error && (
          <>
            <div className="table-toolbar">
              <input
                type="text"
                placeholder="Filtrovat (název, hodnota, změna…)"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-input"
              />
            </div>
            <div className="prehled-wrap">
              <div className="table-wrap">
                <table className="akcie-table">
                  <thead>
                    <tr>
                      <th scope="col">
                        <button type="button" className="th-sort" onClick={() => toggleSort('akcie')}>
                          Akcie {sortCol === 'akcie' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th scope="col">
                        <button type="button" className="th-sort" onClick={() => toggleSort('hodnota')}>
                          Hodnota (CZK) {sortCol === 'hodnota' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                      <th scope="col">
                        <button type="button" className="th-sort" onClick={() => toggleSort('zmena')}>
                          Změna ve dni {sortCol === 'zmena' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSorted.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="no-data">
                          {akcie.length === 0 ? 'Pro zvolené datum nejsou žádná data.' : 'Žádné řádky nevyhovují filtru.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSorted.map((radek) => (
                        <tr key={`${radek.akcie}-${radek.datum}`}>
                          <td>
                            <button
                              type="button"
                              className="link-akcie"
                              onClick={() => navigate(`/graf?akcie=${encodeURIComponent(radek.akcie)}`)}
                            >
                              {radek.akcie}
                            </button>
                          </td>
                          <td>{Number(radek.hodnotaCzk).toLocaleString('cs-CZ')}</td>
                          <td className={radek.zmena?.startsWith('+') ? 'zmena-plus' : 'zmena-minus'}>
                            {radek.zmena ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {!loading && !error && akcie.length > 0 && (
          <p className="hint">Nové akcie přidej v menu Parametrizace akcií.</p>
        )}
      </div>
    </main>
  )
}

export default App
