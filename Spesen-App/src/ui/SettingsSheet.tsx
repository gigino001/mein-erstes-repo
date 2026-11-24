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
  const [verpOn, setVerpOn] = useState(settings.verpEnabled)
  const [rate, setRate] = useState(String(settings.verpRate).replace('.', ','))
  const [hours, setHours] = useState(String(settings.verpThresholdMinutes / 60).replace('.', ','))
  const [name, setName] = useState(settings.name)
  const [mailTo, setMailTo] = useState(settings.mailTo)
  const [opening, setOpening] = useState(formatDuration(settings.openingBalance, true))
  const [openingDate, setOpeningDate] = useState(settings.openingDate)
  const days = useDays()
  const todayKey = toDateKey(new Date())
  const [vYear, setVYear] = useState(Number(todayKey.slice(0, 4)))
  const [vDefault, setVDefault] = useState(formatDays(settings.vacationDefaultDays))
  const manualOf = (y: number) => settings.vacation?.[String(y)]
  const [vDays, setVDays] = useState(manualOf(vYear)?.days !== undefined ? formatDays(manualOf(vYear)!.days!) : '')
  const [vCarry, setVCarry] = useState(manualOf(vYear)?.carryOver !== undefined ? formatDays(manualOf(vYear)!.carryOver!) : '')
  const [vTouched, setVTouched] = useState(false)
  const [error, setError] = useState('')

  const changeYear = (y: number) => {
    const m = manualOf(y)
    setVYear(y)
    setVDays(m?.days !== undefined ? formatDays(m.days) : '')
    setVCarry(m?.carryOver !== undefined ? formatDays(m.carryOver) : '')
    setVTouched(false)
  }
  const resetYear = () => {
    setVDays('')
    setVCarry('')
    setVTouched(true)
    setError('')
  }
  /** Leer = automatisch (undefined), ungültig = null. */
  const optionalDays = (text: string) => (text.trim() === '' ? undefined : parseDays(text))
  const vDefaultNum = parseDays(vDefault)
  const vDaysNum = optionalDays(vDays)
  const vCarryNum = optionalDays(vCarry)
  const draftYear = { ...(vDaysNum != null ? { days: vDaysNum } : {}), ...(vCarryNum != null ? { carryOver: vCarryNum } : {}) }
  const draft = {
    ...settings,
    vacationDefaultDays: vDefaultNum ?? settings.vacationDefaultDays,
    vacation: { ...settings.vacation, [String(vYear)]: draftYear },
  }
  const vInfo = vacationFor(draft, vYear, days)
  const vPreview = summarizeVacation(vYear, days, draft, todayKey)

  const save = async () => {
    const r = toNumber(rate)
    const h = toNumber(hours)
    const o = parseDuration(opening)
    if (verpOn && !(r >= 0)) return setError('Verpflegung: bitte einen Betrag eintragen.')
    if (verpOn && !(h > 0)) return setError('Schwelle: bitte Stunden eintragen, z. B. 8.')
    if (o === null) return setError('Startsaldo: bitte als H:MM eintragen, z. B. 12:30 oder -2:00.')
    if (!openingDate) return setError('Bitte einen Stichtag wählen.')
    if (vDefaultNum === null) return setError('Standard-Urlaubstage: bitte eine Zahl eintragen, z. B. 30.')
    let vacation = settings.vacation
    if (vTouched) {
      if (vDaysNum === null) return setError('Urlaubstage: bitte eine Zahl eintragen, z. B. 30 oder 27,5, oder leer lassen für automatisch.')
      if (vCarryNum === null) return setError('Resturlaub: bitte eine Zahl eintragen, z. B. 2,5, oder leer lassen für automatisch.')
      const next = { ...settings.vacation }
      if (Object.keys(draftYear).length) next[String(vYear)] = draftYear
      else delete next[String(vYear)]
      vacation = next
    }
    await updateSettings({ vacation, vacationDefaultDays: vDefaultNum, vacationVersion: 2, name: name.trim() || settings.name, verpEnabled: verpOn, ...(verpOn ? { verpRate: r, verpThresholdMinutes: Math.round(h * 60) } : {}), mailTo: mailTo.trim(), openingBalance: o, openingDate })
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
      <div className="switch-row">
        <div className="grow">
          <div className="switch-title">Verpflegungspauschale</div>
          <div className="note">Schalte sie aus, wenn sie für dich nicht gilt. Dann verschwindet sie überall, auch aus der Abrechnung.</div>
        </div>
        <button className="switch" role="switch" aria-checked={verpOn} aria-label="Verpflegungspauschale verwenden" onClick={() => { setVerpOn(!verpOn); setError('') }}>
          <span className="knob" />
        </button>
      </div>
      {verpOn && (
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
      )}
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
        <div className="label">Urlaub</div>
        <div className="field">
          <label className="label" htmlFor="st-vac-default">Urlaubstage pro Jahr (kommen am 1. Januar dazu)</label>
          <input id="st-vac-default" inputMode="decimal" value={vDefault} onChange={(e) => { setVDefault(e.target.value); setError('') }} />
        </div>
        <div className="row between">
          <div className="label">Jahr {vYear}</div>
          <span className="row">
            <button className="icon-btn small" onClick={() => changeYear(vYear - 1)} aria-label="Vorheriges Jahr">‹</button>
            <button className="icon-btn small" onClick={() => changeYear(vYear + 1)} aria-label="Nächstes Jahr">›</button>
          </span>
        </div>
        <div className="row">
          <div className="field grow">
            <label className="label" htmlFor="st-vac">Urlaubstage {vYear}</label>
            <input id="st-vac" inputMode="decimal" placeholder={`${formatDays(vInfo.defaultDays)} (automatisch)`} value={vDays} onChange={(e) => { setVDays(e.target.value); setVTouched(true); setError('') }} />
          </div>
          <div className="field grow">
            <label className="label" htmlFor="st-vac-carry">Resturlaub aus {vYear - 1}</label>
            <input id="st-vac-carry" inputMode="decimal" placeholder={`${formatDays(vInfo.autoCarryOver)} (automatisch)`} value={vCarry} onChange={(e) => { setVCarry(e.target.value); setVTouched(true); setError('') }} />
          </div>
        </div>
        <div className="note">
          Leer lassen heißt automatisch: Am 1. Januar kommen {formatDays(vInfo.defaultDays)} Tage dazu, plus der Rest des Vorjahres. Fängst du mitten im Jahr an, trage hier die Tage ein, die dir für {vYear} zustehen.
        </div>
        {(vDays.trim() !== '' || vCarry.trim() !== '') && (
          <button className="btn slim" onClick={resetYear}>Zurück auf automatisch</button>
        )}
        <div className="note vac-sum">
          {vPreview.unset
            ? `Für ${vYear} ist kein Urlaubsanspruch eingetragen.`
            : `Anspruch ${formatDays(vInfo.entitlement)}${vInfo.manualDays ? ' (manuell)' : ''} + Resturlaub ${formatDays(vInfo.carryOver)}${vInfo.manualCarryOver ? ' (manuell)' : ''} = ${formatDays(vPreview.total)} Tage. Genommen ${formatDays(vPreview.taken)}, geplant ${formatDays(vPreview.planned)}, noch übrig ${formatDays(vPreview.remaining)}.`}
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
