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
  const holidays = holidaysNRW(year)
  let taken = 0
  let planned = 0
  for (const [date, e] of entries) {
    if (e.type !== 'urlaub' || !date.startsWith(`${year}-`) || !isWeekday(date) || holidays.has(date)) continue
    const n = e.half ? 0.5 : 1
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
