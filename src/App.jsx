import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API_URL = '/api'

function isNetworkError(message) {
  if (!message || typeof message !== 'string') return false
  const s = message.toLowerCase()
  return s.includes('failed to fetch') || s.includes('networkerror') || s.includes('load failed') || s.includes('connection') || s.includes('refused') || s.includes('net::')
}

function App() {
  const [datum, setDatum] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [akcie, setAkcie] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingYahoo, setLoadingYahoo] = useState(null)
  const [symboly, setSymboly] = useState([])
  const [vybranaAkcie, setVybranaAkcie] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/akcie/symboly`)
      .then((r) => r.ok ? r.json() : [])
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
    loadAkcie()
  }, [loadAkcie])

  const handleNačístYahoo = (akcieNazev) => {
    setLoadingYahoo(akcieNazev)
    fetch(`${API_URL}/akcie/fetch-yahoo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ akcie: akcieNazev, datum }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || res.statusText)))
        return res.json()
      })
      .then(() => {
        setVybranaAkcie('')
        loadAkcie()
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => setLoadingYahoo(null))
  }

  return (
    <div className="layout">
      <header className="header">
        <h1>Moje první aplikace v Reactu</h1>
      </header>

      <main className="main">
        <div className="main-content">
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
            <div className="yahoo-fetch-wrap">
              <label htmlFor="akcie-select">Načíst kurz z Yahoo pro datum výše:</label>
              <select
                id="akcie-select"
                className="akcie-select"
                value={vybranaAkcie}
                onChange={(e) => setVybranaAkcie(e.target.value)}
              >
                <option value="">— vyber akcii —</option>
                {symboly.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-yahoo"
                disabled={loadingYahoo !== null || !vybranaAkcie}
                onClick={() => {
                  if (!vybranaAkcie) return
                  handleNačístYahoo(vybranaAkcie)
                }}
              >
                {loadingYahoo ? 'Načítám…' : 'Načíst z Yahoo a uložit'}
              </button>
            </div>
          )}

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
            <div className="table-wrap">
              <table className="akcie-table">
                <thead>
                  <tr>
                    <th scope="col">Akcie</th>
                    <th scope="col">Hodnota (CZK)</th>
                    <th scope="col">Změna ve dni</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {akcie.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="no-data">Pro zvolené datum nejsou žádná data.</td>
                    </tr>
                  ) : (
                    akcie.map((radek) => (
                      <tr key={`${radek.akcie}-${radek.datum}`}>
                        <td>{radek.akcie}</td>
                        <td>{Number(radek.hodnotaCzk).toLocaleString('cs-CZ')}</td>
                        <td className={radek.zmena?.startsWith('+') ? 'zmena-plus' : 'zmena-minus'}>
                          {radek.zmena ?? '—'}
                        </td>
                        <td className="td-button">
                          <button
                            type="button"
                            className="btn-yahoo"
                            disabled={loadingYahoo !== null}
                            onClick={() => handleNačístYahoo(radek.akcie)}
                          >
                            {loadingYahoo === radek.akcie ? 'Načítám…' : 'Načíst z Yahoo'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && akcie.length > 0 && (
            <p className="hint">U nových akcií přidej symbol do serveru (server/yahoo-symbols.js).</p>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Zápatí</p>
      </footer>
    </div>
  )
}

export default App
