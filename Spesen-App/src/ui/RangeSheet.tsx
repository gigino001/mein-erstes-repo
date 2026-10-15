import { useMemo, useState } from 'react'
import { saveRange } from '../db/actions'
import { workdaysBetween } from '../domain/calc'
import { toDateKey } from '../domain/time'
import type { DayType } from '../domain/types'
import { TYPE_LABEL } from './labels'
import { Sheet } from './Sheet'

type RangeType = Exclude<DayType, 'arbeit' | 'feiertag'>

export function RangeSheet({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const today = toDateKey(new Date())
  const [type, setType] = useState<RangeType>('urlaub')
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const dates = useMemo(() => workdaysBetween(from, to), [from, to])

  const save = async () => {
    if (!dates.length) return
    await saveRange(dates, type)
    onSaved(`${dates.length} ${dates.length === 1 ? 'Tag' : 'Tage'} eingetragen`)
    onClose()
  }

  return (
    <Sheet title="Zeitraum eintragen" onClose={onClose}>
      <div className="chips">
        {(['urlaub', 'krank', 'abbau'] as RangeType[]).map((t) => (
          <button key={t} className={`chip t-${t}`} aria-pressed={type === t} onClick={() => setType(t)}>{TYPE_LABEL[t]}</button>
        ))}
      </div>
      <div className="row">
        <div className="field grow">
          <label className="label" htmlFor="rg-from">Von</label>
          <input id="rg-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value) }} />
        </div>
        <div className="field grow">
          <label className="label" htmlFor="rg-to">Bis</label>
          <input id="rg-to" type="date" min={from} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <div className="note">
        {dates.length ? `${dates.length} Werktage (Wochenenden und Feiertage zählen nicht). Bestehende Einträge werden ersetzt.` : 'Kein Werktag im Zeitraum.'}
      </div>
      <button className="btn primary block" onClick={save} disabled={!dates.length}>Eintragen</button>
    </Sheet>
  )
}
