import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'akcie.db')

const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS akcie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    akcie TEXT NOT NULL,
    hodnota_czk REAL NOT NULL,
    zmena_ve_dni TEXT NOT NULL,
    datum DATE NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_akcie_datum ON akcie(datum);
`)

const insert = db.prepare(`
  INSERT INTO akcie (akcie, hodnota_czk, zmena_ve_dni, datum) VALUES (?, ?, ?, ?)
`)

const seedData = [
  ['ČEZ', 892, '+1,2 %', '2025-03-10'],
  ['Komerční banka', 824, '-0,5 %', '2025-03-10'],
  ['Erste Group', 1056, '+0,8 %', '2025-03-10'],
  ['Philip Morris CR', 16420, '-0,2 %', '2025-03-10'],
  ['VIG', 548, '+2,1 %', '2025-03-10'],
  ['ČEZ', 898, '+1,8 %', '2025-03-11'],
  ['Komerční banka', 820, '-0,3 %', '2025-03-11'],
  ['Erste Group', 1062, '+0,6 %', '2025-03-11'],
  ['Philip Morris CR', 16480, '+0,4 %', '2025-03-11'],
  ['VIG', 552, '+2,5 %', '2025-03-11'],
  ['ČEZ', 885, '-1,4 %', '2025-03-12'],
  ['Komerční banka', 828, '+1,0 %', '2025-03-12'],
  ['Erste Group', 1058, '-0,4 %', '2025-03-12'],
  ['Philip Morris CR', 16400, '-0,5 %', '2025-03-12'],
  ['VIG', 545, '-1,3 %', '2025-03-12'],
]

const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(...row)
  }
})

try {
  const count = db.prepare('SELECT COUNT(*) as c FROM akcie').get()
  if (count.c === 0) {
    insertMany(seedData)
    console.log('DB inicializována, vloženo', seedData.length, 'řádků.')
  } else {
    console.log('DB již obsahuje data.')
  }
} finally {
  db.close()
}
