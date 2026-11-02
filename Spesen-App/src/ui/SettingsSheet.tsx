import { useState } from 'react'
import { useDays } from '../db/hooks'
import { updateSettings } from '../db/db'
import { formatDuration, parseDuration, toDateKey } from '../domain/time'
import { formatDays, parseDays, summarizeVacation, vacationFor } from '../domain/vacation'
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
  const days = useDays()
  const todayKey = toDateKey(new Date())
  const [vYear, setVYear] = useState(Number(todayKey.slice(0, 4)))
  const initialVac = vacationFor(settings, vYear)
  const [vDays, setVDays] = useState(initialVac.days ? formatDays(initialVac.days) : '')
  const [vCarry, setVCarry] = useState(initialVac.carryOver ? formatDays(initialVac.carryOver) : '')
  const [vTouched, setVTouched] = useState(false)
  const [error, setError] = useState('')

  const changeYear = (y: number) => {
    const v = vacationFor(settings, y)
    setVYear(y)
    setVDays(v.days ? formatDays(v.days) : '')
    setVCarry(v.carryOver ? formatDays(v.carryOver) : '')
    setVTouched(false)
  }
  const vDaysNum = parseDays(vDays)
  const vCarryNum = vCarry.trim() === '' ? 0 : parseDays(vCarry)
  const vPreview = summarizeVacation(
    vYear,
    days,
    { vacation: { ...settings.vacation, [String(vYear)]: { days: vDaysNum ?? 0, carryOver: vCarryNum ?? 0 } } },
    todayKey,
  )

  const save = async () => {
    const r = toNumber(rate)
    const h = toNumber(hours)
    const o = parseDuration(opening)
    if (!(r >= 0)) return setError('Verpflegung: bitte einen Betrag eintragen.')
    if (!(h > 0)) return setError('Schwelle: bitte Stunden eintragen, z. B. 8.')
    if (o === null) return setError('Startsaldo: bitte als H:MM eintragen, z. B. 12:30 oder -2:00.')
    if (!openingDate) return setError('Bitte einen Stichtag wählen.')
    let vacation = settings.vacation
    if (vTouched) {
      if (vDaysNum === null) return setError('Urlaubstage: bitte eine Zahl eintragen, z. B. 30 oder 27,5.')
      if (vCarryNum === null) return setError('Resturlaub: bitte eine Zahl eintragen, z. B. 2,5 oder leer lassen.')
      vacation = { ...settings.vacation, [String(vYear)]: { days: vDaysNum, carryOver: vCarryNum } }
    }
    await updateSettings({ vacation, name: name.trim() || settings.name, verpRate: r, verpThresholdMinutes: Math.round(h * 60), mailTo: mailTo.trim(), openingBalance: o, openingDate })
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
          <label className="label" htmlFor="st-hours">mehr als Stunden</label>
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
      <section className="blk vac-block" aria-label="Urlaub">
        <div className="row between">
          <div className="label">Urlaubstage {vYear}</div>
          <span className="row">
            <button className="icon-btn small" onClick={() => changeYear(vYear - 1)} aria-label="Vorheriges Jahr">‹</button>
            <button className="icon-btn small" onClick={() => changeYear(vYear + 1)} aria-label="Nächstes Jahr">›</button>
          </span>
        </div>
        <div className="row">
          <div className="field grow">
            <label className="label" htmlFor="st-vac">Urlaubstage im Jahr</label>
            <input id="st-vac" inputMode="decimal" placeholder="z. B. 30" value={vDays} onChange={(e) => { setVDays(e.target.value); setVTouched(true); setError('') }} />
          </div>
          <div className="field grow">
            <label className="label" htmlFor="st-vac-carry">Resturlaub Vorjahr</label>
            <input id="st-vac-carry" inputMode="decimal" placeholder="0" value={vCarry} onChange={(e) => { setVCarry(e.target.value); setVTouched(true); setError('') }} />
          </div>
        </div>
        <div className="note">
          {vPreview.unset ? 'Trage deinen Anspruch ein, dann zählt die App mit. Halbe Tage sind erlaubt (z. B. 27,5).' : `Genommen ${formatDays(vPreview.taken)} · geplant ${formatDays(vPreview.planned)} · noch übrig ${formatDays(vPreview.remaining)} von ${formatDays(vPreview.total)} Tagen. Der Anspruch gilt auch für die Folgejahre, bis du ihn änderst.`}
        </div>
      </section>
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
