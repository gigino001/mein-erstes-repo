import { holidaysNRW } from './holidays'
import { isWeekday } from './time'
import type { DayEntry, Settings, VacationYear } from './types'

/**
 * Anspruch und Resturlaub für ein Jahr. Hat das Jahr keinen eigenen Eintrag, gilt der Anspruch
 * des letzten früheren Jahres (ohne Resturlaub). Ohne jeden Eintrag: 0 Tage.
 */
export function vacationFor(s: Pick<Settings, 'vacation'>, year: number): VacationYear {
  const all = s.vacation ?? {}
  const own = all[String(year)]
  if (own) return own
  const earlier = Object.keys(all)
    .map(Number)
    .filter((y) => y < year)
    .sort((a, b) => b - a)[0]
  return { days: earlier === undefined ? 0 : all[String(earlier)]!.days, carryOver: 0 }
}

export interface VacationSummary {
  year: number
  /** Anspruch des Jahres. */
  entitlement: number
  /** Resturlaub aus dem Vorjahr. */
  carryOver: number
  /** Anspruch plus Resturlaub. */
  total: number
  /** Bis einschließlich heute genommen. */
  taken: number
  /** Eingetragen, aber noch in der Zukunft. */
  planned: number
  /** Noch übrig (kann negativ sein, wenn mehr Urlaub eingetragen ist als Anspruch). */
  remaining: number
  /** Anspruch und Resturlaub sind noch nicht eingetragen. */
  unset: boolean
}

/** Alle Urlaubstage eines Jahres (ganz = 1, halb = 0,5). Wochenenden und Feiertage zählen nie. */
function urlaubDays(entries: ReadonlyMap<string, DayEntry>, year: number): { date: string; n: number }[] {
  const holidays = holidaysNRW(year)
  const out: { date: string; n: number }[] = []
  for (const [date, e] of entries) {
    if (e.type !== 'urlaub' || !date.startsWith(`${year}-`) || !isWeekday(date) || holidays.has(date)) continue
    out.push({ date, n: e.half ? 0.5 : 1 })
  }
  return out
}

/**
 * Zählt die Urlaubstage eines Jahres. Ein ganzer Urlaubstag zählt 1, ein halber 0,5.
 * Krank, Abfeiern und Feiertage verbrauchen keinen Urlaub, Wochenenden und Feiertage zählen nie.
 */
export function summarizeVacation(
  year: number,
  entries: ReadonlyMap<string, DayEntry>,
  s: Pick<Settings, 'vacation'>,
  today: string,
): VacationSummary {
  let taken = 0
  let planned = 0
  for (const { date, n } of urlaubDays(entries, year)) {
    if (date <= today) taken += n
    else planned += n
  }
  const v = vacationFor(s, year)
  const total = v.days + v.carryOver
  return { year, entitlement: v.days, carryOver: v.carryOver, total, taken, planned, remaining: total - taken - planned, unset: total === 0 }
}

/** Tage mit Komma, ohne unnötige Nachkommastellen: 18,5 oder 30. */
export function formatDays(n: number): string {
  return (Math.round(n * 2) / 2).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

/** Eingabe wie '27,5' oder '30' → Tage in Halben. Ungültig oder negativ → null. */
export function parseDays(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return null
  return Math.round(Number(t) * 2) / 2
}

export interface VacationMonth {
  year: number
  entitlement: number
  carryOver: number
  total: number
  /** Urlaub, der in diesem Monat eingetragen ist. */
  inMonth: number
  /** Urlaub im Jahr bis einschließlich Monatsende. */
  untilMonthEnd: number
  /** Danach (nach dem Monat) schon eingetragen. */
  afterMonth: number
  /** Anspruch minus Urlaub bis Monatsende. */
  remaining: number
  unset: boolean
}

/** Urlaubsstand für die Monatsabrechnung: im Monat genommen, bis Monatsende genommen, noch übrig. */
export function vacationForMonth(year: number, month: number, entries: ReadonlyMap<string, DayEntry>, s: Pick<Settings, 'vacation'>): VacationMonth {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  const endKey = `${prefix}-31`
  let inMonth = 0
  let untilMonthEnd = 0
  let afterMonth = 0
  for (const { date, n } of urlaubDays(entries, year)) {
    if (date.startsWith(prefix)) inMonth += n
    if (date <= endKey) untilMonthEnd += n
    else afterMonth += n
  }
  const v = vacationFor(s, year)
  const total = v.days + v.carryOver
  return { year, entitlement: v.days, carryOver: v.carryOver, total, inMonth, untilMonthEnd, afterMonth, remaining: total - untilMonthEnd, unset: total === 0 }
}

/** '1 Tag', '2,5 Tage' */
export function daysLabel(n: number): string {
  return `${formatDays(n)} ${Math.abs(n) === 1 ? 'Tag' : 'Tage'}`
}
