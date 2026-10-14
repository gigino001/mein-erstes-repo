import { startTimer, stopTimer } from '../db/actions'
import { useDays, useNow, useSettings, useTimer } from '../db/hooks'
import { calcDay, summarizeMonth } from '../domain/calc'
import { elapsedMinutes } from '../domain/timer'
import { formatDuration, formatTime, toDateKey } from '../domain/time'
import type { DayType } from '../domain/types'
import { euro0, germanDate, longDate } from './format'
import { BackupBanner } from './BackupBanner'
import { Header } from './Header'
import { TYPE_LABEL } from './labels'

const R = 92
const CIRC = 2 * Math.PI * R

interface Props {
  onSettings: () => void
  onEdit: (date: string, preset?: DayType) => void
  onToast: (msg: string) => void
  goTab: (tab: 'monat') => void
}

export function Heute({ onSettings, onEdit, onToast, goTab }: Props) {
  const settings = useSettings()
  const days = useDays()
  const timer = useTimer()
  const now = useNow(timer ? 1000 : 30000)
  const today = toDateKey(new Date(now))
  const entry = days.get(today)
  const result = calcDay(entry, settings)
  const running = !!timer
  const stale = !!timer && toDateKey(new Date(timer.startedAt)) !== today

  const ist = timer && !stale ? elapsedMinutes(timer.startedAt, now) : result.booked && entry?.type === 'arbeit' ? result.work : 0
  const progress = Math.min(1, ist / settings.sollMinutes)
  const reached = ist >= settings.verpThresholdMinutes

  const month = summarizeMonth(Number(today.slice(0, 4)), Number(today.slice(5, 7)), days, settings, today)

  const stamp = async () => {
    if (!running) return startTimer()
    const r = await stopTimer(settings.roundMinutes)
    if (r.complete) onToast('Gespeichert')
    else {
      onToast('Ende fehlt noch. Bitte nachtragen.')
      onEdit(r.date)
    }
  }

  return (
    <>
      <Header title={longDate(today).split(',')[0] ?? ''} sub={germanDate(today)} onSettings={onSettings} />
      <BackupBanner onToast={onToast} />
      {stale && timer && (
        <div className="card warn-card">
          <b>Läuft seit {germanDate(toDateKey(new Date(timer.startedAt)))}, {formatTime(new Date(timer.startedAt).getHours() * 60 + new Date(timer.startedAt).getMinutes())} Uhr</b>
          <div className="note">Das Ende wurde vergessen. Trage es nach.</div>
        </div>
      )}
      <section className="card ring-card">
        <div className="ring">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--line)" strokeWidth="12" />
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--accent)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${progress * CIRC} ${CIRC}`} transform="rotate(-90 110 110)" />
          </svg>
          <div className="ring-in">
            <div className="big mono">{formatDuration(ist)}</div>
            <div className="cap">{ist > settings.sollMinutes ? `${formatDuration(ist - settings.sollMinutes, true)} Überstunden` : `von ${formatDuration(settings.sollMinutes)} Soll`}</div>
          </div>
        </div>
        <div className={`verp${reached ? ' ok' : ''}`}>
          {reached
            ? `Verpflegung ${euro0(settings.verpRate)} erreicht`
            : `Verpflegung ${euro0(settings.verpRate)} ab ${formatDuration(settings.verpThresholdMinutes)} · noch ${formatDuration(settings.verpThresholdMinutes - ist)}`}
        </div>
      </section>

      {running ? (
        <button className="btn stop block" onClick={stamp}>{stale ? 'Ende eintragen' : 'Feierabend stempeln'}</button>
      ) : result.booked && entry?.type === 'arbeit' ? (
        <div className="card row between">
          <div>
            <div className="label">Heute erfasst</div>
            <div className="mono done-line">{entry.start} – {entry.end} · {formatDuration(result.work)}</div>
          </div>
          <button className="btn" onClick={() => onEdit(today)}>Korrigieren</button>
        </div>
      ) : result.booked && entry ? (
        <div className="card row between">
          <span className={`tag t-${entry.type}`}>{TYPE_LABEL[entry.type]}{entry.half ? ' ½' : ''}</span>
          <button className="btn" onClick={() => onEdit(today)}>Ändern</button>
        </div>
      ) : (
        <>
          <button className="btn primary block" onClick={stamp}>Arbeitsbeginn stempeln</button>
          <div className="quick">
            <button className="chip-btn" onClick={() => onEdit(today, 'urlaub')}>Urlaub</button>
            <button className="chip-btn" onClick={() => onEdit(today, 'krank')}>Krank</button>
            <button className="chip-btn" onClick={() => onEdit(today, 'abbau')}>Abfeiern</button>
            <button className="chip-btn" onClick={() => onEdit(today)}>Nachtragen</button>
          </div>
        </>
      )}

      <div className="facts">
        <button className="fact" onClick={() => goTab('monat')}>
          <span className="label">Monat</span>
          <b className={`mono ${month.diff > 0 ? 'pos' : month.diff < 0 ? 'neg' : ''}`}>{formatDuration(month.diff, true)}</b>
        </button>
        <button className="fact" onClick={() => goTab('monat')}>
          <span className="label">Verpflegung</span>
          <b className="mono">{euro0(month.verp)}</b>
        </button>
        <button className="fact" onClick={() => goTab('monat')}>
          <span className="label">Offen</span>
          <b className={`mono ${month.missing.length ? 'neg' : ''}`}>{month.missing.length}</b>
        </button>
      </div>
    </>
  )
}
