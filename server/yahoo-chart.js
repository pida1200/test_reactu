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
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Node)' },
  })
  if (!res.ok) throw new Error(`Yahoo API: ${res.status}`)
  const data = await res.json()
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
  const prevRes = await fetch(prevUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Node)' },
  })
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
