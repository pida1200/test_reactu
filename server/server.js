import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getYahooSymbol, SEZNAM_AKCIÍ } from './yahoo-symbols.js'
import { fetchYahooPriceForDate } from './yahoo-chart.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'akcie.db')

const app = express()
app.use(cors())
app.use(express.json())

const db = new Database(dbPath)

app.get('/api/akcie/symboly', (req, res) => {
  res.json(SEZNAM_AKCIÍ)
})

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
function isValidDatum (str) {
  if (!str || !DATE_REGEX.test(str)) return false
  const d = new Date(str)
  return !Number.isNaN(d.getTime())
}

app.get('/api/akcie', (req, res) => {
  const datum = req.query.datum
  if (!datum) {
    return res.status(400).json({ error: 'Chybí parametr datum (YYYY-MM-DD).' })
  }
  if (!isValidDatum(datum)) {
    return res.status(400).json({ error: 'Neplatný formát data. Použijte YYYY-MM-DD.' })
  }

  const stmt = db.prepare(`
    SELECT akcie, hodnota_czk AS hodnotaCzk, zmena_ve_dni AS zmena, datum
    FROM akcie
    WHERE datum = ?
    ORDER BY akcie
  `)
  const rows = stmt.all(datum)
  res.json(rows)
})

app.post('/api/akcie/fetch-yahoo', async (req, res) => {
  const { akcie: akcieNazev, datum } = req.body || {}
  if (!akcieNazev || !datum) {
    return res.status(400).json({ error: 'Chybí akcie nebo datum v těle požadavku.' })
  }
  if (!isValidDatum(datum)) {
    return res.status(400).json({ error: 'Neplatný formát data. Použijte YYYY-MM-DD.' })
  }

  const symbol = getYahooSymbol(akcieNazev)
  if (!symbol) {
    return res.status(400).json({ error: `Pro akcii "${akcieNazev}" není nastaven symbol Yahoo Finance (server/yahoo-symbols.js).` })
  }

  try {
    const result = await fetchYahooPriceForDate(symbol, datum)
    if (!result) {
      return res.status(404).json({ error: `Pro ${akcieNazev} (${symbol}) nejsou k datu ${datum} data.` })
    }

    const { close, changePercent } = result
    const hodnotaCzk = Math.round(close * 100) / 100
    const znameno = changePercent >= 0 ? '+' : ''
    const zmenaText = `${znameno}${changePercent.toFixed(2)} %`

    const del = db.prepare('DELETE FROM akcie WHERE akcie = ? AND datum = ?')
    const ins = db.prepare(`
      INSERT INTO akcie (akcie, hodnota_czk, zmena_ve_dni, datum) VALUES (?, ?, ?, ?)
    `)
    del.run(akcieNazev, datum)
    ins.run(akcieNazev, hodnotaCzk, zmenaText, datum)

    res.json({
      akcie: akcieNazev,
      hodnotaCzk,
      zmena: zmenaText,
      datum,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: 'Yahoo Finance nebo DB chyba.',
      detail: err.message,
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`API běží na http://localhost:${PORT}`)
})
