import { pool } from './db.js'

async function writeLog(level, message, detail = null) {
  let username = null
  let payload = detail
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && Object.prototype.hasOwnProperty.call(payload, 'username')) {
    const u = payload.username
    username = typeof u === 'string' && u.trim() ? u.trim() : null
    const { username: _ignored, ...rest } = payload
    payload = Object.keys(rest).length > 0 ? rest : null
  }
  const text = typeof payload === 'string' ? payload : payload != null ? JSON.stringify(payload) : null
  try {
    await pool.query(
      'INSERT INTO app_log (username, level, message, detail) VALUES ($1, $2, $3, $4)',
      [username, level, message, text],
    )
  } catch (err) {
    console.error('[logger] Nepodařilo se zapsat do DB:', err.message)
  }
  const prefix = `[${level.toUpperCase()}]`
  const consoleDetail = username ? { username, detail: payload } : payload
  if (level === 'error') console.error(prefix, message, consoleDetail ?? '')
  else if (level === 'warn') console.warn(prefix, message, consoleDetail ?? '')
  else console.log(prefix, message, consoleDetail ?? '')
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
