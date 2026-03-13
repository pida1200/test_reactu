import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fetchYahooPriceForDate, fetchYahooChartRange } from './yahoo-chart.js'
import { initSchema, query, queryOne, execute, ensureDefaultParametrizace } from './db.js'
import { log } from './logger.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(cors())
app.use(express.json())

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

await initSchema()
log.info('Server start', { schema: 'ok' })

async function getYahooSymbolFromDb(akcieNazev) {
  const row = await queryOne('SELECT yahoo_symbol FROM akcie_parametrizace WHERE nazev = $1', [akcieNazev])
  return row?.yahoo_symbol ?? null
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/log', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 1000)
    const offset = Number(req.query.offset) || 0
    const rows = await query(
      `SELECT id, created_at AS "createdAt", level, message, detail
       FROM app_log ORDER BY id DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    )
    const total = (await queryOne('SELECT COUNT(*) AS c FROM app_log')).c
    res.json({ items: rows, total: Number(total) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/akcie/symboly', async (req, res) => {
  const rows = await query('SELECT nazev FROM akcie_parametrizace ORDER BY nazev')
  res.json(rows.map((r) => r.nazev))
})

app.post('/api/akcie/doplnit-vychozi', async (req, res) => {
  try {
    await ensureDefaultParametrizace()
    const rows = await query('SELECT nazev FROM akcie_parametrizace ORDER BY nazev')
    log.info('Doplněny výchozí akcie', { pocet: rows.length })
    res.json({ ok: true, pocet: rows.length, symboly: rows.map((r) => r.nazev) })
  } catch (err) {
    log.error('Doplnit výchozí akcie selhalo', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/akcie/parametrizace', async (req, res) => {
  const rows = await query(
    'SELECT id, nazev, yahoo_symbol AS "yahooSymbol" FROM akcie_parametrizace ORDER BY nazev',
  )
  res.json(rows)
})

app.post('/api/akcie/parametrizace', async (req, res) => {
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
    const rows = await query(
      'INSERT INTO akcie_parametrizace (nazev, yahoo_symbol) VALUES ($1, $2) RETURNING id, nazev, yahoo_symbol AS "yahooSymbol"',
      [n, y],
    )
    log.info('Parametrizace: přidána akcie', { nazev: n, yahooSymbol: y })
    res.status(201).json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Akcie s názvem "${n}" již existuje.` })
    }
    throw err
  }
})

app.put('/api/akcie/parametrizace/:id', async (req, res) => {
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
    const rows = await query(
      'UPDATE akcie_parametrizace SET nazev = $1, yahoo_symbol = $2 WHERE id = $3 RETURNING id, nazev, yahoo_symbol AS "yahooSymbol"',
      [n, y, id],
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Záznam nenalezen.' })
    }
    log.info('Parametrizace: upravena akcie', { id, nazev: n })
    res.json(rows[0])
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Akcie s názvem "${n}" již existuje.` })
    }
    throw err
  }
})

app.delete('/api/akcie/parametrizace/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'Neplatné id.' })
  }
  const rowCount = await execute('DELETE FROM akcie_parametrizace WHERE id = $1', [id])
  if (rowCount === 0) {
    return res.status(404).json({ error: 'Záznam nenalezen.' })
  }
  log.info('Parametrizace: smazána akcie', { id })
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
  const symbol = await getYahooSymbolFromDb(nazev)
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
function isValidDatum(str) {
  if (!str || !DATE_REGEX.test(str)) return false
  const d = new Date(str)
  return !Number.isNaN(d.getTime())
}

app.get('/api/akcie', async (req, res) => {
  const datum = req.query.datum
  if (!datum) {
    return res.status(400).json({ error: 'Chybí parametr datum (YYYY-MM-DD).' })
  }
  if (!isValidDatum(datum)) {
    return res.status(400).json({ error: 'Neplatný formát data. Použijte YYYY-MM-DD.' })
  }
  const rows = await query(
    `SELECT akcie, hodnota_czk AS "hodnotaCzk", zmena_ve_dni AS zmena, datum
     FROM akcie WHERE datum = $1 ORDER BY akcie`,
    [datum],
  )
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

  const symbol = await getYahooSymbolFromDb(akcieNazev)
  if (!symbol) {
    return res.status(400).json({
      error: `Pro akcii "${akcieNazev}" není nastaven symbol Yahoo Finance. Přidej ji v menu Parametrizace akcií.`,
    })
  }

  try {
    const result = await fetchYahooPriceForDate(symbol, datum)
    if (!result) {
      return res.status(404).json({ error: `Pro ${akcieNazev} (${symbol}) nejsou k datu ${datum} data.` })
    }

    const { changePercent } = result
    const hodnotaCzk = Math.round(result.close * 100) / 100
    const znameno = changePercent >= 0 ? '+' : ''
    const zmenaText = `${znameno}${changePercent.toFixed(2)} %`

    await query('DELETE FROM akcie WHERE akcie = $1 AND datum = $2', [akcieNazev, datum])
    await query(
      'INSERT INTO akcie (akcie, hodnota_czk, zmena_ve_dni, datum) VALUES ($1, $2, $3, $4)',
      [akcieNazev, hodnotaCzk, zmenaText, datum],
    )

    res.json({
      akcie: akcieNazev,
      hodnotaCzk,
      zmena: zmenaText,
      datum,
    })
  } catch (err) {
    log.error('Fetch Yahoo pro jednu akcii selhal', { akcie: akcieNazev, datum, err: err.message })
    res.status(500).json({
      error: err.message || 'Yahoo Finance nebo DB chyba.',
    })
  }
})

app.post('/api/akcie/fetch-yahoo-all', async (req, res) => {
  const { datum } = req.body || {}
  if (!datum) {
    return res.status(400).json({ error: 'Chybí datum v těle požadavku.' })
  }
  if (!isValidDatum(datum)) {
    return res.status(400).json({ error: 'Neplatný formát data. Použijte YYYY-MM-DD.' })
  }

  const rows = await query('SELECT nazev, yahoo_symbol FROM akcie_parametrizace ORDER BY nazev')
  const saved = []
  const failed = []

  for (const { nazev, yahoo_symbol: symbol } of rows) {
    try {
      const result = await fetchYahooPriceForDate(symbol, datum)
      if (!result) {
        failed.push({ nazev, reason: 'Žádná data k datu' })
        log.warn('Yahoo: žádná data', { nazev, symbol, datum })
        continue
      }
      const { changePercent } = result
      const hodnotaCzk = Math.round(result.close * 100) / 100
      const znameno = changePercent >= 0 ? '+' : ''
      const zmenaText = `${znameno}${changePercent.toFixed(2)} %`

      await query('DELETE FROM akcie WHERE akcie = $1 AND datum = $2', [nazev, datum])
      await query(
        'INSERT INTO akcie (akcie, hodnota_czk, zmena_ve_dni, datum) VALUES ($1, $2, $3, $4)',
        [nazev, hodnotaCzk, zmenaText, datum],
      )
      saved.push({ nazev, hodnotaCzk })
    } catch (err) {
      failed.push({ nazev, reason: err.message })
      log.error('Yahoo fetch selhal', { nazev, symbol, datum, err: err.message })
    }
  }

  log.info('Načteny kurzy všech akcií z Yahoo', { datum, saved: saved.length, failed: failed.length })
  res.json({ saved: saved.length, failed: failed.length, savedList: saved, failedList: failed })
})

if (process.env.PUBLIC_DIR) {
  app.use(express.static(process.env.PUBLIC_DIR))
  app.get('*', (req, res) => {
    res.sendFile(join(process.env.PUBLIC_DIR, 'index.html'))
  })
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  log.info('API běží', { port: PORT })
})
