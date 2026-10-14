import { holidaysNRW } from './holidays'
import { fromDateKey, isWeekday, parseTime, toDateKey, weekdaysOfMonth } from './time'
import type { DayEntry, Settings } from './types'

export interface DayResult {
  /** Zählt der Tag zu Soll/Ist? Offene Tage (z. B. ohne Zeiten) zählen nicht. */
  booked: boolean
  soll: number
  /** Gearbeitete Minuten. */
  work: number
  /** Angerechnete Minuten für Urlaub/Krank/Feiertag. */
  credit: number
  ist: number
  diff: number
  /** Verpflegung in Euro. */
  verp: number
  /** Ende liegt vor dem Beginn. */
  invalid: boolean
}

export function calcDay(entry: DayEntry | undefined, s: Settings): DayResult {
  if (!entry) {
    return { booked: false, soll: s.sollMinutes, work: 0, credit: 0, ist: 0, diff: 0, verp: 0, invalid: false }
  }
  const start = parseTime(entry.start)
  const end = parseTime(entry.end)
  const hasTimes = start !== null && end !== null
  const invalid = hasTimes && end < start
  const work = hasTimes && !invalid ? end - start : 0
  const fraction = entry.half ? 0.5 : 1
  const credit =
    entry.type === 'urlaub' || entry.type === 'krank' || entry.type === 'feiertag' ? s.sollMinutes * fraction : 0
  const ist = work + credit
  const booked = entry.type === 'arbeit' || entry.half ? hasTimes && !invalid : true
  const auto = work >= s.verpThresholdMinutes ? s.verpRate : 0
  const verp = entry.verpOverride != null ? entry.verpOverride : auto
  return { booked, soll: s.sollMinutes, work, credit, ist, diff: ist - s.sollMinutes, verp: booked ? verp : 0, invalid }
}

/** Liefert den Eintrag eines Tages; Feiertage ohne Eintrag werden automatisch gesetzt. */
export function effectiveEntry(
  date: string,
  entries: ReadonlyMap<string, DayEntry>,
  holidays: ReadonlyMap<string, string>,
): DayEntry | undefined {
  const own = entries.get(date)
  if (own) return own
  if (holidays.has(date) && isWeekday(date)) return { date, type: 'feiertag', half: false }
  return undefined
}

export interface MonthSummary {
  soll: number
  ist: number
  diff: number
  verp: number
  verpDays: number
  /** Vergangene Werktage ohne Eintrag (und ohne Feiertag). */
  missing: string[]
  days: { date: string; entry?: DayEntry; result: DayResult }[]
}

export function summarizeMonth(
  year: number,
  month: number,
  entries: ReadonlyMap<string, DayEntry>,
  s: Settings,
  today: string,
): MonthSummary {
  const holidays = holidaysNRW(year)
  const out: MonthSummary = { soll: 0, ist: 0, diff: 0, verp: 0, verpDays: 0, missing: [], days: [] }
  for (const date of weekdaysOfMonth(year, month)) {
    const entry = effectiveEntry(date, entries, holidays)
    const result = calcDay(entry, s)
    out.days.push({ date, entry, result })
    if (result.booked) {
      out.soll += result.soll
      out.ist += result.ist
      if (result.verp > 0) {
        out.verp += result.verp
        out.verpDays++
      }
    } else if (date < today && date >= s.openingDate) {
      out.missing.push(date)
    }
  }
  out.diff = out.ist - out.soll
  return out
}

export interface Adjustment {
  date: string
  minutes: number
  note?: string
}

/**
 * Saldo des Stundenkontos: Startsaldo + Summe aller Tagesdifferenzen + Korrekturen bis einschließlich `upTo`.
 * Automatische Feiertage haben Differenz 0 und müssen nicht einzeln gezählt werden.
 */
export function balanceAt(
  upTo: string,
  entries: ReadonlyMap<string, DayEntry>,
  adjustments: readonly Adjustment[],
  s: Settings,
): number {
  let total = s.openingBalance
  for (const [date, entry] of entries) {
    if (date < s.openingDate || date > upTo || !isWeekday(date)) continue
    const r = calcDay(entry, s)
    if (r.booked) total += r.diff
  }
  for (const a of adjustments) if (a.date >= s.openingDate && a.date <= upTo) total += a.minutes
  return total
}

/** Werktage von..bis (inklusive), ohne Feiertage. */
export function workdaysBetween(from: string, to: string): string[] {
  const out: string[] = []
  if (!from || !to || from > to) return out
  const cache = new Map<number, Map<string, string>>()
  for (let d = fromDateKey(from); toDateKey(d) <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12)) {
    const key = toDateKey(d)
    const year = d.getFullYear()
    if (!cache.has(year)) cache.set(year, holidaysNRW(year))
    if (isWeekday(key) && !cache.get(year)!.has(key)) out.push(key)
  }
  return out
}
