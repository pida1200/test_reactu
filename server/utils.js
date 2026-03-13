const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function isValidDatum(str) {
  if (!str || !DATE_REGEX.test(str)) return false
  const d = new Date(str)
  return !Number.isNaN(d.getTime())
}
