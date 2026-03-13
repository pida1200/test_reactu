import { initSchema, queryOne, pool } from './db.js'

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

async function main() {
  try {
    await initSchema()

    const countAkcie = await queryOne('SELECT COUNT(*) AS c FROM akcie')
    if (Number(countAkcie.c) === 0) {
      for (const [akcie, hodnota_czk, zmena_ve_dni, datum] of seedData) {
        await pool.query(
          'INSERT INTO akcie (akcie, hodnota_czk, zmena_ve_dni, datum) VALUES ($1, $2, $3, $4)',
          [akcie, hodnota_czk, zmena_ve_dni, datum],
        )
      }
      console.log('DB inicializována, vloženo', seedData.length, 'řádků.')
    } else {
      console.log('Tabulka akcie již obsahuje data.')
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
