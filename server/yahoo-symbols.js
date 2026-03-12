/**
 * Mapování názvů akcií (z DB) na symboly Yahoo Finance.
 * Pražská burza: .PR, Vídeň: .VI
 */
export const AKCIE_TO_YAHOO_SYMBOL = {
  'ČEZ': 'CEZ.PR',
  'Komerční banka': 'KOMB.PR',
  'Erste Group': 'EBS.VI',
  'Philip Morris CR': 'TABAK.PR',
  'VIG': 'VIG.VI',
}

export const SEZNAM_AKCIÍ = Object.keys(AKCIE_TO_YAHOO_SYMBOL)

export function getYahooSymbol(akcieNazev) {
  return AKCIE_TO_YAHOO_SYMBOL[akcieNazev] || null
}
