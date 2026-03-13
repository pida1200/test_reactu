import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

const API_URL = '/api'

function isNetworkError(message) {
  if (!message || typeof message !== 'string') return false
  const s = message.toLowerCase()
  return s.includes('failed to fetch') || s.includes('networkerror') || s.includes('load failed') || s.includes('connection') || s.includes('refused') || s.includes('net::')
}

function App() {
  const navigate = useNavigate()
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
  const [vizual, setVizual] = useState('table')

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
    const id = setTimeout(() => loadAkcie(), 0)
    return () => clearTimeout(id)
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
              <button
                type="button"
                className="btn-yahoo btn-graf"
                disabled={!vybranaAkcie}
                onClick={() => {
                  if (vybranaAkcie) navigate(`/graf?akcie=${encodeURIComponent(vybranaAkcie)}`)
                }}
              >
                Zobrazit graf
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
            <>
              <div className="variant-picker">
                <span className="variant-label">Zobrazení:</span>
                {(['table', 'cards', 'list']).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`variant-btn ${vizual === v ? 'active' : ''}`}
                    onClick={() => setVizual(v)}
                  >
                    {v === 'table' && 'Tabulka'}
                    {v === 'cards' && 'Karty'}
                    {v === 'list' && 'Seznam'}
                  </button>
                ))}
              </div>
              <div className={`prehled-wrap prehled-${vizual}`}>
                {vizual === 'table' && (
                  <div className="table-wrap">
                    <table className="akcie-table">
                      <thead>
                        <tr>
                          <th scope="col">Akcie</th>
                          <th scope="col">Hodnota (CZK)</th>
                          <th scope="col">Změna ve dni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {akcie.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="no-data">Pro zvolené datum nejsou žádná data.</td>
                          </tr>
                        ) : (
                          akcie.map((radek) => (
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
                )}
                {vizual === 'cards' && (
                  <div className="cards-wrap">
                    {akcie.length === 0 ? (
                      <p className="no-data cards-no-data">Pro zvolené datum nejsou žádná data.</p>
                    ) : (
                      akcie.map((radek) => (
                        <div key={`${radek.akcie}-${radek.datum}`} className="akcie-card">
                          <button
                            type="button"
                            className="akcie-card-name link-akcie"
                            onClick={() => navigate(`/graf?akcie=${encodeURIComponent(radek.akcie)}`)}
                          >
                            {radek.akcie}
                          </button>
                          <div className="akcie-card-value">{Number(radek.hodnotaCzk).toLocaleString('cs-CZ')} CZK</div>
                          <div className={`akcie-card-zmena ${radek.zmena?.startsWith('+') ? 'zmena-plus' : 'zmena-minus'}`}>
                            {radek.zmena ?? '—'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                {vizual === 'list' && (
                  <div className="list-wrap">
                    {akcie.length === 0 ? (
                      <p className="no-data list-no-data">Pro zvolené datum nejsou žádná data.</p>
                    ) : (
                      <ul className="akcie-list">
                        {akcie.map((radek) => (
                          <li key={`${radek.akcie}-${radek.datum}`} className="akcie-list-item">
                            <button
                              type="button"
                              className="list-name link-akcie"
                              onClick={() => navigate(`/graf?akcie=${encodeURIComponent(radek.akcie)}`)}
                            >
                              {radek.akcie}
                            </button>
                            <span className="list-value">{Number(radek.hodnotaCzk).toLocaleString('cs-CZ')} CZK</span>
                            <span className={`list-zmena ${radek.zmena?.startsWith('+') ? 'zmena-plus' : 'zmena-minus'}`}>
                              {radek.zmena ?? '—'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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
