import { useState } from 'react'
import { updateSettings } from '../db/db'
import { formatDuration, parseDuration } from '../domain/time'
import type { Settings } from '../domain/types'
import { BackupSection } from './BackupSection'
import { Sheet } from './Sheet'

const toNumber = (text: string) => Number(text.replace(',', '.'))

export function SettingsSheet({ settings, onClose, onSaved }: { settings: Settings; onClose: () => void; onSaved: (msg: string) => void }) {
  const [rate, setRate] = useState(String(settings.verpRate).replace('.', ','))
  const [hours, setHours] = useState(String(settings.verpThresholdMinutes / 60).replace('.', ','))
  const [name, setName] = useState(settings.name)
  const [mailTo, setMailTo] = useState(settings.mailTo)
  const [opening, setOpening] = useState(formatDuration(settings.openingBalance, true))
  const [openingDate, setOpeningDate] = useState(settings.openingDate)
  const [error, setError] = useState('')

  const save = async () => {
    const r = toNumber(rate)
    const h = toNumber(hours)
    const o = parseDuration(opening)
    if (!(r >= 0)) return setError('Verpflegung: bitte einen Betrag eintragen.')
    if (!(h > 0)) return setError('Schwelle: bitte Stunden eintragen, z. B. 8.')
    if (o === null) return setError('Startsaldo: bitte als H:MM eintragen, z. B. 12:30 oder -2:00.')
    if (!openingDate) return setError('Bitte einen Stichtag wählen.')
    await updateSettings({ name: name.trim() || settings.name, verpRate: r, verpThresholdMinutes: Math.round(h * 60), mailTo: mailTo.trim(), openingBalance: o, openingDate })
    onSaved('Einstellungen gespeichert')
    onClose()
  }

  return (
    <Sheet title="Einstellungen" onClose={onClose}>
      <div className="list">
        <div className="led"><span>Soll pro Tag</span><b className="mono">{formatDuration(settings.sollMinutes)} (40 h / Woche)</b></div>
        <div className="led"><span>Arbeitstage</span><b className="mono">Mo–Fr</b></div>
        <div className="led"><span>Rundung</span><b className="mono">{settings.roundMinutes} Min.</b></div>
        <div className="led"><span>Feiertage</span><b className="mono">NRW</b></div>
      </div>
      <div className="row">
        <div className="field grow">
          <label className="label" htmlFor="st-rate">Verpflegung €</label>
          <input id="st-rate" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div className="field grow">
          <label className="label" htmlFor="st-hours">ab Stunden</label>
          <input id="st-hours" inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div className="field grow">
          <label className="label" htmlFor="st-open">Startsaldo H:MM</label>
          <input id="st-open" value={opening} onChange={(e) => setOpening(e.target.value)} />
        </div>
        <div className="field grow">
          <label className="label" htmlFor="st-date">gilt ab</label>
          <input id="st-date" type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="st-name">Name auf der Abrechnung</label>
        <input id="st-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label className="label" htmlFor="st-mail">Mail-Empfänger</label>
        <input id="st-mail" type="email" placeholder="name@firma.de" value={mailTo} onChange={(e) => setMailTo(e.target.value)} />
      </div>
      <div className="note">Mail-Betreff: <span className="mono">{settings.mailSubject}</span></div>
      {error && <div className="hint" role="alert">{error}</div>}
      <button className="btn primary block" onClick={save}>Speichern</button>
      <BackupSection settings={settings} onToast={onSaved} onClose={onClose} />
    </Sheet>
  )
}
