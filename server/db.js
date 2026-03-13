import pg from 'pg'

const { Pool } = pg

function getPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL není nastavena (např. postgresql://akcie:akcie@localhost:5432/akcie)')
  }
  return new Pool({ connectionString })
}

let poolInstance
function getPoolInstance() {
  if (!poolInstance) poolInstance = getPool()
  return poolInstance
}

const DEFAULT_PARAMETRIZACE = [
  ['ČEZ', 'CEZ.PR'],
  ['Komerční banka', 'KOMB.PR'],
  ['Erste Group', 'EBS.VI'],
  ['Philip Morris CR', 'TABAK.PR'],
  ['VIG', 'VIG.VI'],
  ['Moneta', 'MONET.PR'],
  ['Colt CZ', 'CZG.PR'],
  ['Doosan', 'DSPW.PR'],
]

export async function initSchema() {
  const client = await getPoolInstance().connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS akcie (
        id SERIAL PRIMARY KEY,
        akcie VARCHAR(255) NOT NULL,
        hodnota_czk DOUBLE PRECISION NOT NULL,
        zmena_ve_dni VARCHAR(50) NOT NULL,
        datum DATE NOT NULL
      )
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_akcie_datum ON akcie(datum)')
    await client.query(`
      CREATE TABLE IF NOT EXISTS akcie_parametrizace (
        id SERIAL PRIMARY KEY,
        nazev VARCHAR(255) NOT NULL UNIQUE,
        yahoo_symbol VARCHAR(50) NOT NULL
      )
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_parametrizace_nazev ON akcie_parametrizace(nazev)')

    await client.query(`
      CREATE TABLE IF NOT EXISTS app_log (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        detail TEXT
      )
    `)
    await client.query('CREATE INDEX IF NOT EXISTS idx_app_log_created_at ON app_log(created_at DESC)')

    await ensureDefaultParametrizaceClient(client)
  } finally {
    client.release()
  }
}

/** Doplní nebo aktualizuje výchozí akcie v parametrizaci (lze volat i po startu serveru). */
export async function ensureDefaultParametrizace() {
  const client = await getPoolInstance().connect()
  try {
    await ensureDefaultParametrizaceClient(client)
  } finally {
    client.release()
  }
}

async function ensureDefaultParametrizaceClient(client) {
  for (const [nazev, yahoo_symbol] of DEFAULT_PARAMETRIZACE) {
    await client.query(
      `INSERT INTO akcie_parametrizace (nazev, yahoo_symbol) VALUES ($1, $2)
       ON CONFLICT (nazev) DO UPDATE SET yahoo_symbol = EXCLUDED.yahoo_symbol`,
      [nazev, yahoo_symbol],
    )
  }
}

export async function query(text, params) {
  const res = await getPoolInstance().query(text, params)
  return res.rows
}

export async function queryOne(text, params) {
  const res = await getPoolInstance().query(text, params)
  return res.rows[0] ?? null
}

export async function execute(text, params) {
  const res = await getPoolInstance().query(text, params)
  return res.rowCount
}

export const pool = new Proxy(
  {},
  {
    get(_, prop) {
      return getPoolInstance()[prop]
    },
  },
)
