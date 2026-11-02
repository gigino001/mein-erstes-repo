import { useMemo, useState } from 'react'
import { useDays, useSettings } from '../db/hooks'
import { toDateKey } from '../domain/time'
import { formatDays, summarizeVacation } from '../domain/vacation'

interface Props {
  /** Kompakt für „Heute": nur Titel, Restzahl und Balken. */
  compact?: boolean
  /** Antippen der kompakten Karte. */
  onOpen?: () => void
  /** Öffnet die Einstellungen zum Eintragen der Urlaubstage. */
  onSettings: () => void
}

export function VacationCard({ compact, onOpen, onSettings }: Props) {
  const settings = useSettings()
  const days = useDays()
  const todayKey = toDateKey(new Date())
  const [year, setYear] = useState(Number(todayKey.slice(0, 4)))
  const v = useMemo(() => summarizeVacation(year, days, settings, todayKey), [year, days, settings, todayKey])

  const total = Math.max(v.total, v.taken + v.planned, 1)
  const takenPct = (v.taken / total) * 100
  const plannedPct = (v.planned / total) * 100
  const over = v.remaining < 0

  const body = v.unset && v.taken + v.planned === 0 ? (
    <>
      <div className="note">Trage deine Urlaubstage für {year} ein, dann siehst du hier immer, wie viele noch übrig sind.</div>
      <button className="btn slim" onClick={onSettings}>Urlaubstage eintragen</button>
    </>
  ) : (
    <>
      <div className="vac-main">
        <b className={`mono vac-left${over ? ' neg' : ''}`}>{formatDays(v.remaining)}</b>
        <span className="note">{over ? `Tage zu viel (von ${formatDays(v.total)})` : `von ${formatDays(v.total)} Tagen übrig`}</span>
      </div>
      <div className="vac-bar" role="img" aria-label={`${formatDays(v.taken)} genommen, ${formatDays(v.planned)} geplant`}>
        <span className="vac-taken" style={{ width: `${takenPct}%` }} />
        <span className="vac-planned" style={{ width: `${plannedPct}%` }} />
      </div>
      {!compact && (
        <div className="list vac-list">
          <div className="led"><span>Anspruch {year}</span><b className="mono">{formatDays(v.entitlement)}</b></div>
          {v.carryOver > 0 && <div className="led"><span>Resturlaub aus dem Vorjahr</span><b className="mono">{formatDays(v.carryOver)}</b></div>}
          <div className="led"><span>Genommen</span><b className="mono">{formatDays(v.taken)}</b></div>
          <div className="led"><span>Geplant (in der Zukunft)</span><b className="mono">{formatDays(v.planned)}</b></div>
          <div className="led sum"><span><b>Noch übrig</b></span><b className={`mono ${over ? 'neg' : ''}`}>{formatDays(v.remaining)}</b></div>
        </div>
      )}
      {compact && (v.taken > 0 || v.planned > 0) && (
        <div className="note">{formatDays(v.taken)} genommen{v.planned > 0 ? `, ${formatDays(v.planned)} geplant` : ''}</div>
      )}
    </>
  )

  const head = (
    <div className="row between">
      <span className="label">Urlaub {year}</span>
      {!compact && (
        <span className="row">
          <button className="icon-btn small" onClick={() => setYear(year - 1)} aria-label="Vorheriges Jahr">‹</button>
          <button className="icon-btn small" onClick={() => setYear(year + 1)} aria-label="Nächstes Jahr">›</button>
        </span>
      )}
    </div>
  )

  if (compact) {
    return (
      <button className="card vac-card compact" onClick={onOpen} aria-label={`Urlaub ${year}`}>
        {head}
        {body}
      </button>
    )
  }
  return (
    <section className="card vac-card">
      {head}
      {body}
    </section>
  )
}

/** Zeigt, wie viele Urlaubstage nach einer geplanten Eintragung noch übrig wären. */
export function VacationAfter({ entries, years }: { entries: ReadonlyMap<string, import('../domain/types').DayEntry>; years: number[] }) {
  const settings = useSettings()
  const todayKey = toDateKey(new Date())
  return (
    <>
      {[...new Set(years)].map((y) => {
        const v = summarizeVacation(y, entries, settings, todayKey)
        if (v.unset) return null
        const over = v.remaining < 0
        return (
          <div key={y} className={`vac-note${over ? ' over' : ''}`}>
            {over ? `Urlaub ${y}: ${formatDays(-v.remaining)} ${v.remaining === -1 ? 'Tag' : 'Tage'} mehr als dein Anspruch.` : `Urlaub ${y}: danach noch ${formatDays(v.remaining)} ${v.remaining === 1 ? 'Tag' : 'Tage'}.`}
          </div>
        )
      })}
    </>
  )
}
