import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fetchYahooPriceForDate, fetchYahooChartRange } from './yahoo-chart.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'akcie.db')

const app = express()
app.use(cors())
app.use(express.json())

const db = new Database(dbPath)
// Tabulka vždy existuje (pro čerstvý klon bez init-db)
db.exec(`
  CREATE TABLE IF NOT EXISTS akcie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    akcie TEXT NOT NULL,
    hodnota_czk REAL NOT NULL,
    zmena_ve_dni TEXT NOT NULL,
    datum DATE NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_akcie_datum ON akcie(datum);

  CREATE TABLE IF NOT EXISTS akcie_parametrizace (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nazev TEXT NOT NULL UNIQUE,
    yahoo_symbol TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_parametrizace_nazev ON akcie_parametrizace(nazev);
`)

const defaultParametrizace = [
  ['ČEZ', 'CEZ.PR'],
  ['Komerční banka', 'KOMB.PR'],
  ['Erste Group', 'EBS.VI'],
  ['Philip Morris CR', 'TABAK.PR'],
  ['VIG', 'VIG.VI'],
]
const countParam = db.prepare('SELECT COUNT(*) as c FROM akcie_parametrizace').get()
if (countParam.c === 0) {
  const ins = db.prepare('INSERT INTO akcie_parametrizace (nazev, yahoo_symbol) VALUES (?, ?)')
  for (const [nazev, yahoo_symbol] of defaultParametrizace) {
    ins.run(nazev, yahoo_symbol)
  }
}

function getYahooSymbolFromDb(akcieNazev) {
  const row = db.prepare('SELECT yahoo_symbol FROM akcie_parametrizace WHERE nazev = ?').get(akcieNazev)
  return row ? row.yahoo_symbol : null
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/akcie/symboly', (req, res) => {
  const rows = db.prepare('SELECT nazev FROM akcie_parametrizace ORDER BY nazev').all()
  res.json(rows.map((r) => r.nazev))
})

app.get('/api/akcie/parametrizace', (req, res) => {
  const rows = db.prepare('SELECT id, nazev, yahoo_symbol AS yahooSymbol FROM akcie_parametrizace ORDER BY nazev').all()
  res.json(rows)
})

app.post('/api/akcie/parametrizace', (req, res) => {
  const { nazev, yahooSymbol } = req.body || {}
  if (!nazev || !yahooSymbol || typeof nazev !== 'string' || typeof yahooSymbol !== 'string') {
    return res.status(400).json({ error: 'Chybí nebo jsou neplatné pole nazev a yahooSymbol.' })
  }
  const n = nazev.trim()
  const y = yahooSymbol.trim()
  if (!n || !y) {
    return res.status(400).json({ error: 'Pole nazev a yahooSymbol nesmí být prázdná.' })
  }
  try {
    const stmt = db.prepare('INSERT INTO akcie_parametrizace (nazev, yahoo_symbol) VALUES (?, ?)')
    const info = stmt.run(n, y)
    const row = db.prepare('SELECT id, nazev, yahoo_symbol AS yahooSymbol FROM akcie_parametrizace WHERE id = ?').get(info.lastInsertRowid)
    res.status(201).json(row)
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: `Akcie s názvem "${n}" již existuje.` })
    }
    throw err
  }
})

app.put('/api/akcie/parametrizace/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Neplatné id.' })
  }
  const { nazev, yahooSymbol } = req.body || {}
  if (!nazev || !yahooSymbol || typeof nazev !== 'string' || typeof yahooSymbol !== 'string') {
    return res.status(400).json({ error: 'Chybí nebo jsou neplatné pole nazev a yahooSymbol.' })
  }
  const n = nazev.trim()
  const y = yahooSymbol.trim()
  if (!n || !y) {
    return res.status(400).json({ error: 'Pole nazev a yahooSymbol nesmí být prázdná.' })
  }
  try {
    const stmt = db.prepare('UPDATE akcie_parametrizace SET nazev = ?, yahoo_symbol = ? WHERE id = ?')
    const info = stmt.run(n, y, id)
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Záznam nenalezen.' })
    }
    const row = db.prepare('SELECT id, nazev, yahoo_symbol AS yahooSymbol FROM akcie_parametrizace WHERE id = ?').get(id)
    res.json(row)
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: `Akcie s názvem "${n}" již existuje.` })
    }
    throw err
  }
})

app.delete('/api/akcie/parametrizace/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Neplatné id.' })
  }
  const stmt = db.prepare('DELETE FROM akcie_parametrizace WHERE id = ?')
  const info = stmt.run(id)
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Záznam nenalezen.' })
  }
  res.status(204).send()
})

const GRAF_PERIODS = ['week', 'month', 'year']
app.get('/api/akcie/graf', async (req, res) => {
  const { nazev, period } = req.query
  if (!nazev || !period) {
    return res.status(400).json({ error: 'Chybí parametr nazev nebo period (week, month, year).' })
  }
  if (!GRAF_PERIODS.includes(period)) {
    return res.status(400).json({ error: 'Neplatný period. Použijte week, month nebo year.' })
  }
  const symbol = getYahooSymbolFromDb(nazev)
  if (!symbol) {
    return res.status(400).json({ error: `Pro akcii "${nazev}" není nastaven symbol. Přidej ji v Parametrizaci akcií.` })
  }
  try {
    const data = await fetchYahooChartRange(symbol, period)
    res.json({ nazev, period, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message || 'Nepodařilo se načíst data z Yahoo Finance.' })
  }
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

  const symbol = getYahooSymbolFromDb(akcieNazev)
  if (!symbol) {
    return res.status(400).json({ error: `Pro akcii "${akcieNazev}" není nastaven symbol Yahoo Finance. Přidej ji v menu Parametrizace akcií.` })
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
      error: err.message || 'Yahoo Finance nebo DB chyba.',
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`API běží na http://localhost:${PORT}`)
})
