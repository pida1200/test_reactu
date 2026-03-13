import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import './App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Filler,
)

const API_URL = '/api'
const PERIODS = [
  { value: 'week', label: 'Týden' },
  { value: 'month', label: 'Měsíc' },
  { value: 'year', label: 'Rok' },
]

export default function GrafAkcji() {
  const [searchParams] = useSearchParams()
  const akcieFromUrl = searchParams.get('akcie') || ''
  const [symboly, setSymboly] = useState([])
  const [vybranaAkcie, setVybranaAkcie] = useState(akcieFromUrl)
  const [period, setPeriod] = useState('week')
  const [grafData, setGrafData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/akcie/symboly`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSymboly)
      .catch(() => setSymboly([]))
  }, [])

  useEffect(() => {
    if (akcieFromUrl) {
      const id = setTimeout(() => setVybranaAkcie(akcieFromUrl), 0)
      return () => clearTimeout(id)
    }
  }, [akcieFromUrl])

  const loadGraf = useCallback(() => {
    if (!vybranaAkcie) {
      setGrafData(null)
      return
    }
    setLoading(true)
    setError(null)
    setGrafData(null)
    fetch(`${API_URL}/akcie/graf?nazev=${encodeURIComponent(vybranaAkcie)}&period=${period}`)
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d.error || res.statusText)))
        return res.json()
      })
      .then(({ data }) => {
        setGrafData({
          labels: data.map((p) => p.date),
          datasets: [
            {
              label: vybranaAkcie,
              data: data.map((p) => p.close),
              borderColor: '#646cff',
              backgroundColor: 'rgba(100, 108, 255, 0.1)',
              fill: true,
              tension: 0.2,
            },
          ],
        })
      })
      .catch((err) => {
        setError(err.message)
        setGrafData(null)
      })
      .finally(() => setLoading(false))
  }, [vybranaAkcie, period])

  useEffect(() => {
    const id = setTimeout(() => loadGraf(), 0)
    return () => clearTimeout(id)
  }, [loadGraf])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: vybranaAkcie ? `Kurz – ${vybranaAkcie}` : '',
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y?.toLocaleString('cs-CZ')} CZK`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => value?.toLocaleString('cs-CZ'),
        },
      },
    },
  }

  return (
    <main className="main">
      <div className="main-content main-content-wide">
        <h2 className="page-title">Graf akcií</h2>
        <p className="hint">Vyber akcii a období (týden, měsíc, rok) pro zobrazení vývoje kurzu.</p>

        <div className="graf-controls">
          <select
            className="akcie-select"
            value={vybranaAkcie}
            onChange={(e) => setVybranaAkcie(e.target.value)}
            id="graf-akcie-select"
          >
            <option value="">— vyber akcii —</option>
            {symboly.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="period-buttons">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`btn-yahoo period-btn ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="error">Chyba: {error}</p>}
        {loading && <p className="loading">Načítám data…</p>}

        {!loading && grafData && grafData.datasets[0].data.length > 0 && (
          <div className="graf-wrap">
            <Line data={grafData} options={chartOptions} />
          </div>
        )}

        {!loading && vybranaAkcie && grafData && grafData.datasets[0].data.length === 0 && (
          <p className="hint">Pro zvolené období nejsou k dispozici žádná data.</p>
        )}
      </div>
    </main>
  )
}
