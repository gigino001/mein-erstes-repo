import { useState } from 'react'
import { useSettings } from '../db/hooks'
import { formatDuration, formatEuro } from '../domain/time'
import { Icon, type IconName } from './Icon'

const TABS: { id: IconName; label: string; plan: string[] }[] = [
  { id: 'heute', label: 'Heute', plan: ['Stempel-Ring und Start/Stopp', 'Schnellwahl Urlaub, Krank, Abfeiern'] },
  { id: 'monat', label: 'Monat', plan: ['Stempelkarte Mo–Fr', 'Tag bearbeiten, halbe Tage, Zeitraum'] },
  { id: 'belege', label: 'Belege', plan: ['Foto, Texterkennung, Kategorien', 'Bewirtung mit Anlass und Personen'] },
  { id: 'konto', label: 'Konto', plan: ['Saldo, Monatsverlauf, Buchungen'] },
  { id: 'abrechnung', label: 'Abrechnung', plan: ['PDF mit Belegen, Excel, CSV', 'Teilen und Mail'] },
]

export function App() {
  const [tab, setTab] = useState<IconName>('heute')
  const s = useSettings()
  const current = TABS.find((t) => t.id === tab)!

  return (
    <div className="app">
      <main className="screens">
        <div className="top">
          <h1>{current.label}</h1>
          <div className="sub">Aufbau läuft · Meilenstein M0 und M1 stehen</div>
        </div>
        <section className="card">
          <div className="label">Kommt als Nächstes</div>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
            {current.plan.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
        <section className="card">
          <div className="label">Einstellungen aus der Datenbank</div>
          <div className="mono" style={{ marginTop: 10, display: 'grid', gap: 4, fontSize: 13.5 }}>
            <span>Soll pro Tag: {formatDuration(s.sollMinutes)}</span>
            <span>
              Verpflegung: {formatEuro(s.verpRate)} ab {formatDuration(s.verpThresholdMinutes)}
            </span>
            <span>Rundung: {s.roundMinutes} Min.</span>
            <span>Mail-Betreff: {s.mailSubject}</span>
          </div>
        </section>
      </main>
      <nav className="tabbar" aria-label="Hauptmenü">
        {TABS.map((t) => (
          <button key={t.id} className="tab" aria-current={t.id === tab ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <Icon name={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
