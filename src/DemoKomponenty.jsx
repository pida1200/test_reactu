function DemoTableBase({ variant, title }) {
  const rows = [
    { akcie: 'ČEZ', hodnotaCzk: 892, zmena: '+1.20 %', isPlus: true },
    { akcie: 'Moneta', hodnotaCzk: 621, zmena: '-0.80 %', isPlus: false },
    { akcie: 'Colt CZ', hodnotaCzk: 1045, zmena: '+2.10 %', isPlus: true },
    { akcie: 'Doosan', hodnotaCzk: 312, zmena: '-1.30 %', isPlus: false },
    { akcie: 'Erste', hodnotaCzk: 1337, zmena: '+0.45 %', isPlus: true },
  ]

  return (
    <div className="demo-card demo-table-card">
      <div className="demo-card-body">
        <h3 className="demo-card-title">{title}</h3>
        <p className="demo-card-text">Typ tabulky: {variant}</p>
      </div>

      <div className="demo-table-wrap">
        <table className={`akcie-table demo-table demo-table-${variant}`} aria-label={title}>
          <thead>
            <tr>
              <th scope="col" className="td-akcie">
                Akcie
              </th>
              <th scope="col" className="td-hodnota">
                Hodnota (CZK)
              </th>
              <th scope="col" className="td-zmena">
                Změna ve dni
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.akcie}>
                <td className="td-akcie">{r.akcie}</td>
                <td className="td-hodnota">{r.hodnotaCzk.toLocaleString('cs-CZ')}</td>
                <td className={`td-zmena ${r.isPlus ? 'zmena-plus' : 'zmena-minus'}`}>{r.zmena}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DemoKomponenty() {
  return (
    <main className="main main-top">
      <div className="main-content main-content-wide demo-page">
        <h2 className="page-title">Demo tabulkový styl (varianta 2)</h2>
        <p className="hint">Zebra proužky + jemný hover styl pro všechny tabulky v projektu.</p>

        <div className="demo-grid">
          <DemoTableBase variant="2" title="Varianta 2: zebra stripes + jemný hover" />
        </div>
      </div>
    </main>
  )
}

