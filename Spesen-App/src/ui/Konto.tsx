import { useMemo } from 'react'
import { deleteAdjustment } from '../db/actions'
import { useAdjustments, useDays, useSettings } from '../db/hooks'
import { monthlyChanges } from '../domain/calc'
import { formatDuration, toDateKey } from '../domain/time'
import { germanDate } from './format'
import { Header } from './Header'

const monthName = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('de-DE', { month: 'short' }).replace('.', '')
const monthLong = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
const tone = (n: number) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

/** Balken je Monat: oben Plus (Akzent), unten Minus (Rot). Werte stehen direkt am Balken. */
function Bars({ data }: { data: { label: string; value: number }[] }) {
  const W = 320
  const H = 176
  const zero = 84
  const max = Math.max(60, ...data.map((d) => Math.abs(d.value)))
  const scale = 50 / max
  const slot = W / data.length
  const bw = Math.min(44, slot - 14)
  return (
    <svg className="bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Änderung des Stundenkontos pro Monat">
      <line x1="0" x2={W} y1={zero} y2={zero} stroke="var(--line)" strokeWidth="1.5" />
      {data.map((d, i) => {
        const h = Math.max(2, Math.abs(d.value) * scale)
        const x = i * slot + (slot - bw) / 2
        const neg = d.value < 0
        const y = neg ? zero : zero - h
        return (
          <g key={d.label + i}>
            <rect x={x} y={y} width={bw} height={h} rx="4" fill={neg ? 'var(--krank)' : 'var(--accent)'} />
            <text className="val" x={x + bw / 2} y={neg ? zero + h + 15 : zero - h - 6} textAnchor="middle">{formatDuration(d.value, true)}</text>
            <text x={x + bw / 2} y={H - 4} textAnchor="middle">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

export function Konto({ onSettings, onAdjust, onToast }: { onSettings: () => void; onAdjust: () => void; onToast: (m: string) => void }) {
  const settings = useSettings()
  const days = useDays()
  const adjustments = useAdjustments()
  const today = toDateKey(new Date())
  const months = useMemo(() => monthlyChanges(today, days, adjustments, settings), [today, days, adjustments, settings])
  const stand = months.at(-1)?.end ?? settings.openingBalance
  const shown = months.slice(-6)
  const tage = Math.round((stand / settings.sollMinutes) * 10) / 10
  const listed = adjustments.filter((a) => a.date >= settings.openingDate)

  return (
    <>
      <Header title="Stundenkonto" sub={`Stand ${germanDate(today)}`} onSettings={onSettings} />
      <section className="card stand">
        <span className="label">Aktueller Saldo</span>
        <div className={`big mono ${tone(stand)}`}>{formatDuration(stand, true)}</div>
        <div className="note">
          {stand > 0 ? `≈ ${String(tage).replace('.', ',')} Arbeitstage zum Abfeiern` : stand < 0 ? 'Minusstunden' : 'ausgeglichen'}
        </div>
      </section>
      <section className="card">
        <div className="label spaced">Änderung pro Monat</div>
        <Bars data={shown.map((m) => ({ label: monthName(m.key), value: m.total }))} />
      </section>
      <div className="list">
        <div className="led"><span>Startsaldo ({germanDate(settings.openingDate)})</span><b className="mono">{formatDuration(settings.openingBalance, true)}</b></div>
        {months.map((m) => (
          <div key={m.key} className="led col">
            <div className="between-line"><span>{monthLong(m.key)}</span><b className={`mono ${tone(m.total)}`}>{formatDuration(m.total, true)}</b></div>
            {m.adjust !== 0 && <div className="note">davon Buchungen {formatDuration(m.adjust, true)}</div>}
          </div>
        ))}
        <div className="led sum"><span><b>Stand</b></span><b className={`mono ${tone(stand)}`}>{formatDuration(stand, true)}</b></div>
      </div>
      {listed.length > 0 && (
        <>
          <h3 className="h3">Manuelle Buchungen</h3>
          <div className="list">
            {listed.map((a) => (
              <div key={a.id} className="led">
                <span>{germanDate(a.date)}{a.note ? ` · ${a.note}` : ''}</span>
                <span className="row">
                  <b className={`mono ${tone(a.minutes)}`}>{formatDuration(a.minutes, true)}</b>
                  <button className="icon-btn small" aria-label="Buchung löschen" onClick={async () => { await deleteAdjustment(a.id!); onToast('Buchung gelöscht') }}>×</button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <button className="btn block" onClick={onAdjust}>Manuelle Buchung</button>
    </>
  )
}
