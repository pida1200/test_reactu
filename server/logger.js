import { pool } from './db.js'

async function writeLog(level, message, detail = null) {
  const text = typeof detail === 'string' ? detail : detail != null ? JSON.stringify(detail) : null
  try {
    await pool.query(
      'INSERT INTO app_log (level, message, detail) VALUES ($1, $2, $3)',
      [level, message, text],
    )
  } catch (err) {
    console.error('[logger] Nepodařilo se zapsat do DB:', err.message)
  }
  const prefix = `[${level.toUpperCase()}]`
  if (level === 'error') console.error(prefix, message, detail ?? '')
  else if (level === 'warn') console.warn(prefix, message, detail ?? '')
  else console.log(prefix, message, detail ?? '')
}

export const log = {
  info(message, detail) {
    return writeLog('info', message, detail)
  },
  warn(message, detail) {
    return writeLog('warn', message, detail)
  },
  error(message, detail) {
    return writeLog('error', message, detail)
  },
}
