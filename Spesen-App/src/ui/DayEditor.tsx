import { useState } from 'react'
import { deleteDay, saveDay } from '../db/actions'
import { calcDay } from '../domain/calc'
import { holidaysNRW } from '../domain/holidays'
import { formatDuration, formatTime, fromDateKey, parseTime, roundToStep } from '../domain/time'
import { DEFAULT_SETTINGS, type DayEntry, type DayType, type Settings } from '../domain/types'
import { euro0, germanDate } from './format'
import { TYPE_LABEL, WEEKDAY_SHORT } from './labels'
import { Sheet } from './Sheet'

const EDIT_TYPES: DayType[] = ['arbeit', 'urlaub', 'krank', 'abbau']

interface Props {
  date: string
  preset?: DayType
  existing?: DayEntry
  settings: Settings
  onClose: () => void
  onSaved: (msg: string) => void
}

export function DayEditor({ date, preset, existing, settings, onClose, onSaved }: Props) {
  const holiday = holidaysNRW(Number(date.slice(0, 4))).get(date)
  const [draft, setDraft] = useState<DayEntry>(() => {
    if (existing) return { ...existing }
    const type = preset && preset !== 'feiertag' ? preset : 'arbeit'
    return { date, type, half: false, start: type === 'arbeit' ? '08:00' : '', end: type === 'arbeit' ? '16:00' : '' }
  })
  const [error, setError] = useState('')
  const showTimes = draft.type === 'arbeit' || draft.half
  const result = calcDay(draft, settings ?? DEFAULT_SETTINGS)
  const complete = !showTimes || (parseTime(draft.start) !== null && parseTime(draft.end) !== null)

  const patch = (p: Partial<DayEntry>) => {
    setError('')
    setDraft((d) => ({ ...d, ...p }))
  }
  const setType = (type: DayType) =>
    patch({
      type,
      half: false,
      verpOverride: type === 'arbeit' ? draft.verpOverride : null,
      start: type === 'arbeit' ? draft.start || '08:00' : '',
      end: type === 'arbeit' ? draft.end || '16:00' : '',
    })
  const setHalf = (half: boolean) =>
    patch({ half, start: half ? draft.start || '08:00' : '', end: half ? draft.end || '12:00' : '' })
  const setTime = (field: 'start' | 'end', value: string) => {
    const m = parseTime(value)
    patch({ [field]: m === null ? '' : formatTime(Math.min(roundToStep(m, settings.roundMinutes), 24 * 60 - settings.roundMinutes)) })
  }

  const save = async () => {
    if (showTimes && !complete) return setError('Bitte Beginn und Ende eintragen.')
    if (result.invalid) return setError('Das Ende liegt vor dem Beginn.')
    const entry: DayEntry = { ...draft }
    if (!showTimes) {
      delete entry.start
      delete entry.end
    }
    await saveDay(entry)
    onSaved('Gespeichert')
    onClose()
  }
  const remove = async () => {
    await deleteDay(date)
    onSaved('Eintrag gelöscht')
    onClose()
  }

  return (
    <Sheet title={`${WEEKDAY_SHORT[fromDateKey(date).getDay()]}, ${germanDate(date)}`} onClose={onClose}>
      {holiday && !existing && <div className="note">Feiertag: {holiday}. Ohne Eintrag wird der Tag automatisch als Feiertag gezählt.</div>}
      <div>
        <div className="label spaced">Tagestyp</div>
        <div className="chips">
          {EDIT_TYPES.map((t) => (
            <button key={t} className={`chip t-${t}`} aria-pressed={draft.type === t} onClick={() => setType(t)}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      {draft.type !== 'arbeit' && draft.type !== 'feiertag' && (
        <div>
          <div className="label spaced">Umfang</div>
          <div className="seg">
            <button aria-pressed={!draft.half} onClick={() => setHalf(false)}>Ganzer Tag</button>
            <button aria-pressed={draft.half} onClick={() => setHalf(true)}>Halber Tag</button>
          </div>
        </div>
      )}
      {showTimes && (
        <div className="row">
          <div className="field grow">
            <label className="label" htmlFor="ed-start">{draft.type === 'arbeit' ? 'Beginn' : 'Gearbeitet von'}</label>
            <input id="ed-start" type="time" step={settings.roundMinutes * 60} value={draft.start ?? ''} onChange={(e) => setTime('start', e.target.value)} />
          </div>
          <div className="field grow">
            <label className="label" htmlFor="ed-end">Ende</label>
            <input id="ed-end" type="time" step={settings.roundMinutes * 60} value={draft.end ?? ''} onChange={(e) => setTime('end', e.target.value)} />
          </div>
        </div>
      )}
      {draft.type === 'arbeit' && (
      <div>
        <div className="label spaced">Verpflegung</div>
        <div className="seg">
          <button aria-pressed={draft.verpOverride == null} onClick={() => patch({ verpOverride: null })}>Automatisch</button>
          <button aria-pressed={draft.verpOverride === 0} onClick={() => patch({ verpOverride: 0 })}>Keine</button>
          <button aria-pressed={draft.verpOverride === settings.verpRate} onClick={() => patch({ verpOverride: settings.verpRate })}>{euro0(settings.verpRate)}</button>
        </div>
      </div>
      )}
      <div className="res">
        {complete ? (
          <>
            <div><span className="label">Ist</span><b className="mono">{formatDuration(result.ist)}</b></div>
            <div><span className="label">Differenz</span><b className={`mono ${result.diff > 0 ? 'pos' : result.diff < 0 ? 'neg' : ''}`}>{formatDuration(result.diff, true)}</b></div>
            <div><span className="label">Verpflegung</span><b className="mono">{euro0(result.verp)}</b></div>
          </>
        ) : (
          <div className="note" style={{ gridColumn: '1 / -1' }}>Zeiten fehlen noch.</div>
        )}
      </div>
      {error && <div className="hint" role="alert">{error}</div>}
      <div className="row two">
        <button className="btn primary" onClick={save}>Speichern</button>
        {existing ? (
          <button className="btn danger" onClick={remove}>Eintrag löschen</button>
        ) : (
          <button className="btn ghost" onClick={onClose}>Abbrechen</button>
        )}
      </div>
    </Sheet>
  )
}
