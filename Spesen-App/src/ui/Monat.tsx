import { useMemo, useState } from 'react'
import { useDays, useSettings } from '../db/hooks'
import { summarizeMonth } from '../domain/calc'
import { formatDuration, fromDateKey, toDateKey } from '../domain/time'
import type { DayType } from '../domain/types'
import { euro0, shortDate } from './format'
import { Header } from './Header'
import { TYPE_LABEL } from './labels'

interface Props {
  onSettings: () => void
  onEdit: (date: string, preset?: DayType) => void
  onRange: () => void
}

/** Gruppiert Werktage in Wochen (Mo–Fr). Lücken sind null. */
function weeksOf(dates: string[]): (string | null)[][] {
  const weeks = new Map<string, (string | null)[]>()
  for (const date of dates) {
    const d = fromDateKey(date)
    const wd = d.getDay()
    const monday = toDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - (wd - 1), 12))
    const row = weeks.get(monday) ?? [null, null, null, null, null]
    row[wd - 1] = date
    weeks.set(monday, row)
  }
  return [...weeks.values()]
}

export function Monat({ onSettings, onEdit, onRange }: Props) {
  const settings = useSettings()
  const days = useDays()
  const todayKey = toDateKey(new Date())
  const [ym, setYm] = useState(() => ({ y: Number(todayKey.slice(0, 4)), m: Number(todayKey.slice(5, 7)) }))
  const summary = useMemo(() => summarizeMonth(ym.y, ym.m, days, settings, todayKey), [ym, days, settings, todayKey])
  const weeks = useMemo(() => weeksOf(summary.days.map((d) => d.date)), [summary])
  const byDate = useMemo(() => new Map(summary.days.map((d) => [d.date, d])), [summary])
  const shift = (n: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m - 1 + n, 1)
      return { y: d.getFullYear(), m: d.getMonth() + 1 }
    })
  const title = new Date(ym.y, ym.m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <>
      <Header title={title} sub={`${formatDuration(summary.ist)} von ${formatDuration(summary.soll)} gebucht · ${euro0(summary.verp)} Verpflegung`} onSettings={onSettings} />
      <div className="row between">
        <div className="row">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Vorheriger Monat">‹</button>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Nächster Monat">›</button>
        </div>
        <button className="btn slim" onClick={onRange}>Zeitraum eintragen</button>
      </div>
      <div className="legend">
        {(['arbeit', 'urlaub', 'krank', 'abbau', 'feiertag'] as DayType[]).map((t) => (
          <span key={t} className={`tag t-${t}`}>{TYPE_LABEL[t]}</span>
        ))}
      </div>
      <div>
        <div className="punch dow-row">
          {['MO', 'DI', 'MI', 'DO', 'FR'].map((d) => <div key={d} className="dow">{d}</div>)}
        </div>
        <div className="punch">
          {weeks.flat().map((date, i) => {
            if (!date) return <div key={i} className="cell empty" />
            const info = byDate.get(date)!
            const e = info.entry
            const booked = info.result.booked
            const label = !booked || !e ? '' : e.type === 'arbeit' ? formatDuration(info.result.ist) : e.half ? `½ ${TYPE_LABEL[e.type]}` : TYPE_LABEL[e.type]
            const missing = summary.missing.includes(date)
            return (
              <button key={date} className={`cell ${booked && e ? `t-${e.type}` : 'open'}${missing ? ' missing' : ''}${date === todayKey ? ' today' : ''}`} onClick={() => onEdit(date)} aria-label={`${shortDate(date)} ${label || 'offen'}`}>
                <span className="d mono">{Number(date.slice(8))}</span>
                <span className="v mono">{label || ' '}</span>
              </button>
            )
          })}
        </div>
      </div>
      {summary.missing.length > 0 && <div className="note warn-text">{summary.missing.length} vergangene Werktage ohne Eintrag.</div>}
      <h3 className="h3">Alle Tage</h3>
      <div className="list">
        {summary.days.map(({ date, entry, result }) => (
          <button key={date} className={`li${date === todayKey ? ' today' : ''}${result.booked ? '' : ' off'}`} onClick={() => onEdit(date)}>
            <span className="dd mono">{shortDate(date)}</span>
            <span>
              {result.booked && entry ? <span className={`tag t-${entry.type}`}>{TYPE_LABEL[entry.type]}{entry.half ? ' ½' : ''}</span> : <span className="note">{summary.missing.includes(date) ? 'fehlt' : '—'}</span>}
              <div className="tm mono">{entry?.start && entry.end ? `${entry.start} – ${entry.end}` : result.booked ? 'ganztags' : 'offen'}</div>
            </span>
            <span className={`df mono ${result.diff > 0 ? 'pos' : result.diff < 0 ? 'neg' : ''}`}>{result.booked ? formatDuration(result.diff, true) : '–'}</span>
          </button>
        ))}
      </div>
    </>
  )
}
