const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

function checkYahooError(data) {
  const err = data?.chart?.error
  if (err) {
    const msg = err.description || err.message || JSON.stringify(err)
    throw new Error(`Yahoo Finance: ${msg}`)
  }
}

/**
 * Načte kurz z Yahoo Finance Chart API pro daný symbol a datum.
 * Vrací { close, previousClose, changePercent } nebo null.
 */
export async function fetchYahooPriceForDate(symbol, datum) {
  const dateFrom = new Date(datum)
  dateFrom.setUTCHours(0, 0, 0, 0)
  const dateTo = new Date(dateFrom)
  dateTo.setUTCDate(dateTo.getUTCDate() + 1)
  const period1 = Math.floor(dateFrom.getTime() / 1000)
  const period2 = Math.floor(dateTo.getTime() / 1000)

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d`
  const res = await fetch(url, { headers: YAHOO_HEADERS })
  if (!res.ok) throw new Error(`Yahoo API: ${res.status} ${res.statusText}`)
  const data = await res.json()
  checkYahooError(data)
  const chart = data?.chart?.result?.[0]
  if (!chart) return null
  const quote = chart?.indicators?.quote?.[0]
  if (!quote || !quote.close || quote.close.length === 0) return null
  const close = quote.close[quote.close.length - 1]
  if (close == null) return null

  const prevDate = new Date(dateFrom)
  prevDate.setUTCDate(prevDate.getUTCDate() - 1)
  const prevPeriod1 = Math.floor(prevDate.getTime() / 1000)
  const prevUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${prevPeriod1}&period2=${period1}&interval=1d`
  const prevRes = await fetch(prevUrl, { headers: YAHOO_HEADERS })
  let previousClose = null
  if (prevRes.ok) {
    const prevData = await prevRes.json()
    const prevChart = prevData?.chart?.result?.[0]
    const prevQuote = prevChart?.indicators?.quote?.[0]
    if (prevQuote?.close?.length) {
      previousClose = prevQuote.close[prevQuote.close.length - 1]
    }
  }

  let changePercent = 0
  if (previousClose != null && previousClose !== 0) {
    changePercent = ((close - previousClose) / previousClose) * 100
  }
  return { close, previousClose, changePercent }
}

/**
 * Načte historická data kurzu z Yahoo Finance pro zobrazení grafu.
 * period: 'week' | 'month' | 'year'
 * Vrací pole { date: 'YYYY-MM-DD', close: number }.
 */
export async function fetchYahooChartRange(symbol, period) {
  const now = new Date()
  const to = Math.floor(now.getTime() / 1000)
  let daysBack
  if (period === 'week') daysBack = 7
  else if (period === 'month') daysBack = 30
  else if (period === 'year') daysBack = 365
  else daysBack = 30

  const fromDate = new Date(now)
  fromDate.setDate(fromDate.getDate() - daysBack)
  fromDate.setUTCHours(0, 0, 0, 0)
  const from = Math.floor(fromDate.getTime() / 1000)

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${from}&period2=${to}&interval=1d`
  const res = await fetch(url, { headers: YAHOO_HEADERS })
  if (!res.ok) throw new Error(`Yahoo API: ${res.status} ${res.statusText}`)
  const data = await res.json()
  checkYahooError(data)
  const chart = data?.chart?.result?.[0]
  if (!chart) return []
  const timestamps = chart.timestamp || []
  const quote = chart?.indicators?.quote?.[0]
  const closes = quote?.close || []
  const result = []
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i]
    if (close == null) continue
    const d = new Date(timestamps[i] * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    result.push({ date: dateStr, close: Math.round(close * 100) / 100 })
  }
  return result
}
