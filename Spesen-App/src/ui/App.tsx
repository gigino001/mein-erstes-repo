import { useCallback, useState } from 'react'
import { useDays, useSettings } from '../db/hooks'
import type { DayType } from '../domain/types'
import { AdjustmentSheet } from './AdjustmentSheet'
import { DayEditor } from './DayEditor'
import { Header } from './Header'
import { Heute } from './Heute'
import { Icon, type IconName } from './Icon'
import { Konto } from './Konto'
import { Monat } from './Monat'
import { RangeSheet } from './RangeSheet'
import { SettingsSheet } from './SettingsSheet'
import { Toast } from './Toast'

const TABS: { id: IconName; label: string; plan?: string[] }[] = [
  { id: 'heute', label: 'Heute' },
  { id: 'monat', label: 'Monat' },
  { id: 'belege', label: 'Belege', plan: ['Foto, Texterkennung, Kategorien', 'Bewirtung mit Anlass und Personen'] },
  { id: 'konto', label: 'Konto' },
  { id: 'abrechnung', label: 'Abrechnung', plan: ['PDF mit Belegen, Excel, CSV', 'Teilen und Mail'] },
]

type Overlay = { kind: 'day'; date: string; preset?: DayType } | { kind: 'range' } | { kind: 'adjust' } | { kind: 'settings' } | null

export function App() {
  const [tab, setTab] = useState<IconName>('heute')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toast, setToast] = useState('')
  const settings = useSettings()
  const days = useDays()
  const close = useCallback(() => setOverlay(null), [])
  const clearToast = useCallback(() => setToast(''), [])
  const openSettings = () => setOverlay({ kind: 'settings' })
  const edit = (date: string, preset?: DayType) => setOverlay({ kind: 'day', date, preset })
  const current = TABS.find((t) => t.id === tab)!

  return (
    <div className="app">
      <main className="screens">
        {tab === 'heute' && <Heute onSettings={openSettings} onEdit={edit} onToast={setToast} goTab={setTab} />}
        {tab === 'monat' && <Monat onSettings={openSettings} onEdit={edit} onRange={() => setOverlay({ kind: 'range' })} />}
        {tab === 'konto' && <Konto onSettings={openSettings} onAdjust={() => setOverlay({ kind: 'adjust' })} onToast={setToast} />}
        {current.plan && (
          <>
            <Header title={current.label} sub="Kommt in einem der nächsten Schritte" onSettings={openSettings} />
            <section className="card">
              <div className="label">Geplant</div>
              <ul className="plan">{current.plan.map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
          </>
        )}
      </main>
      <nav className="tabbar" aria-label="Hauptmenü">
        {TABS.map((t) => (
          <button key={t.id} className="tab" aria-current={t.id === tab ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <Icon name={t.id} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      {overlay?.kind === 'day' && (
        <DayEditor key={overlay.date} date={overlay.date} preset={overlay.preset} existing={days.get(overlay.date)} settings={settings} onClose={close} onSaved={setToast} />
      )}
      {overlay?.kind === 'adjust' && <AdjustmentSheet onClose={close} onSaved={setToast} />}
      {overlay?.kind === 'range' && <RangeSheet onClose={close} onSaved={setToast} />}
      {overlay?.kind === 'settings' && <SettingsSheet settings={settings} onClose={close} onSaved={setToast} />}
      {toast && <Toast message={toast} onDone={clearToast} />}
    </div>
  )
}
