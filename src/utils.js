export function isNetworkError(message) {
  if (!message || typeof message !== 'string') return false
  const s = message.toLowerCase()
  return (
    s.includes('failed to fetch') ||
    s.includes('networkerror') ||
    s.includes('load failed') ||
    s.includes('connection') ||
    s.includes('refused') ||
    s.includes('net::')
  )
}

export function parseZmena(zmena) {
  if (!zmena || zmena === '—') return null
  const m = zmena.replace(',', '.').match(/([+-]?\d+(?:\.\d+)?)/)
  return m ? Number(m[1]) : null
}
