import { holidaysNRW } from './holidays'
import { isWeekday } from './time'
import type { DayEntry, Settings, VacationYear } from './types'

/** Standard: So viele Urlaubstage kommen am 1. Januar jedes Jahres dazu. */
export const DEFAULT_VACATION_DAYS = 30

/** Alles, was die Urlaubsrechnung aus den Einstellungen braucht. */
export type VacationSettings = Partial<Pick<Settings, 'vacation' | 'vacationDefaultDays' | 'openingDate'>>

const startYear = (s: VacationSettings) => Number((s.openingDate ?? '2026-01-01').slice(0, 4))

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

export interface VacationEntitlement {
  year: number
  /** Anspruch des Jahres (manuell oder Standard). */
  entitlement: number
  /** Was der Standard wäre (am 1. Januar). */
  defaultDays: number
  /** Der Anspruch wurde von Hand eingetragen. */
  manualDays: boolean
  /** Resturlaub aus dem Vorjahr (manuell oder automatisch). */
  carryOver: number
  /** Was automatisch übernommen würde. */
  autoCarryOver: number
  /** Der Resturlaub wurde von Hand eingetragen. */
  manualCarryOver: boolean
  /** Anspruch plus Resturlaub. */
  total: number
}

/**
 * Anspruch und Resturlaub eines Jahres.
 *
 * Standardmäßig kommen am 1. Januar `vacationDefaultDays` (30) Tage dazu, plus der Rest des Vorjahres.
 * Beides lässt sich pro Jahr von Hand überschreiben, z. B. bei Eintritt mitten im Jahr.
 * Gerechnet wird ab dem Jahr des Stichtags; davor gibt es keinen Anspruch (außer von Hand eingetragen).
 * Ein überzogener Urlaub (Rest unter 0) wird nicht mit ins nächste Jahr genommen.
 */
export function vacationFor(s: VacationSettings, year: number, entries: ReadonlyMap<string, DayEntry> = new Map()): VacationEntitlement {
  const def = s.vacationDefaultDays ?? DEFAULT_VACATION_DAYS
  const manual = (y: number): VacationYear | undefined => s.vacation?.[String(y)]
  const first = startYear(s)

  if (year < first) {
    const m = manual(year)
    const days = m?.days ?? 0
    const carry = m?.carryOver ?? 0
    return { year, entitlement: days, defaultDays: 0, manualDays: m?.days !== undefined, carryOver: carry, autoCarryOver: 0, manualCarryOver: m?.carryOver !== undefined, total: days + carry }
  }

  let remainingPrev = 0
  let result!: VacationEntitlement
  for (let y = first; y <= year; y++) {
    const m = manual(y)
    const days = m?.days ?? def
    const auto = y === first ? 0 : Math.max(0, remainingPrev)
    const carry = m?.carryOver ?? auto
    const total = days + carry
    result = { year: y, entitlement: days, defaultDays: def, manualDays: m?.days !== undefined, carryOver: carry, autoCarryOver: auto, manualCarryOver: m?.carryOver !== undefined, total }
    remainingPrev = total - urlaubDays(entries, y).reduce((sum, d) => sum + d.n, 0)
  }
  return result
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
  /** Es gibt für dieses Jahr keinen Anspruch (Standard auf 0 und nichts eingetragen). */
  unset: boolean
}

/**
 * Zählt die Urlaubstage eines Jahres. Ein ganzer Urlaubstag zählt 1, ein halber 0,5.
 * Krank, Abfeiern und Feiertage verbrauchen keinen Urlaub, Wochenenden und Feiertage zählen nie.
 */
export function summarizeVacation(year: number, entries: ReadonlyMap<string, DayEntry>, s: VacationSettings, today: string): VacationSummary {
  let taken = 0
  let planned = 0
  for (const { date, n } of urlaubDays(entries, year)) {
    if (date <= today) taken += n
    else planned += n
  }
  const v = vacationFor(s, year, entries)
  return { year, entitlement: v.entitlement, carryOver: v.carryOver, total: v.total, taken, planned, remaining: v.total - taken - planned, unset: v.total === 0 }
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
export function vacationForMonth(year: number, month: number, entries: ReadonlyMap<string, DayEntry>, s: VacationSettings): VacationMonth {
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
  const v = vacationFor(s, year, entries)
  return { year, entitlement: v.entitlement, carryOver: v.carryOver, total: v.total, inMonth, untilMonthEnd, afterMonth, remaining: v.total - untilMonthEnd, unset: v.total === 0 }
}

/** '1 Tag', '2,5 Tage' */
export function daysLabel(n: number): string {
  return `${formatDays(n)} ${Math.abs(n) === 1 ? 'Tag' : 'Tage'}`
}

/**
 * Stellt ältere Urlaubs-Einstellungen um. Früher bedeutete ein Eintrag „Anspruch und Resturlaub dieses Jahres",
 * ein Resturlaub von 0 hieß „nichts eingetragen" und der Anspruch galt für Folgejahre.
 * Jetzt: Einträge sind manuelle Werte, alles andere rechnet die App automatisch.
 */
type VacationFields = { vacation?: Record<string, VacationYear>; vacationVersion?: number; vacationDefaultDays?: number }

export function migrateVacationSettings<T extends VacationFields>(s: T): T & VacationFields {
  if (s.vacationVersion === 2) return s
  const out: Record<string, VacationYear> = {}
  let latestYear = -1
  let latestDays: number | undefined
  for (const [y, v] of Object.entries(s.vacation ?? {})) {
    const e: VacationYear = {}
    if (typeof v.days === 'number' && v.days > 0) e.days = v.days
    if (typeof v.carryOver === 'number' && v.carryOver > 0) e.carryOver = v.carryOver
    if (Object.keys(e).length) out[y] = e
    if (typeof v.days === 'number' && v.days > 0 && Number(y) > latestYear) {
      latestYear = Number(y)
      latestDays = v.days
    }
  }
  const migrated: T & VacationFields = { ...s, vacation: out, vacationVersion: 2 }
  if (s.vacationDefaultDays === undefined && latestDays !== undefined) migrated.vacationDefaultDays = latestDays
  return migrated
}
