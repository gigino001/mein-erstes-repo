import { balanceAt, summarizeMonth, type Adjustment } from './calc'
import { sumAmounts } from './receipt'
import { fromDateKey } from './time'
import { CATEGORY_LABEL, TYPE_LABEL, type Category, type DayEntry, type Settings } from './types'

export interface ReceiptLike {
  id?: number
  date: string
  vendor: string
  category: Category
  amount: number
  anlass?: string
  personen?: number
  photo?: Blob
}

export interface ReportDay {
  date: string
  /** 'Arbeit', 'Urlaub ½', 'Feiertag' … leer bei offenen Tagen. */
  label: string
  start?: string
  end?: string
  ist: number
  diff: number
  verp: number
  booked: boolean
  missing: boolean
}

export interface Report {
  year: number
  month: number
  /** 'Oktober 2026' */
  title: string
  name: string
  days: ReportDay[]
  soll: number
  ist: number
  diff: number
  verp: number
  verpDays: number
  verpRate: number
  receipts: ReceiptLike[]
  byCategory: Record<Category, number>
  receiptTotal: number
  /** Verpflegung plus Belege. */
  total: number
  /** Stundenkonto; null, wenn der Monat vor dem Stichtag des Startsaldos liegt. */
  konto: { previous: number; change: number; end: number } | null
  warnings: string[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const lastDayOf = (year: number, month: number) => `${year}-${pad(month)}-${pad(new Date(year, month, 0).getDate())}`
const germanShort = (key: string) => `${key.slice(8)}.${key.slice(5, 7)}.`

export function buildReport(p: {
  year: number
  month: number
  entries: ReadonlyMap<string, DayEntry>
  receipts: readonly ReceiptLike[]
  adjustments: readonly Adjustment[]
  settings: Settings
  today: string
}): Report {
  const { year, month, entries, adjustments, settings, today } = p
  const summary = summarizeMonth(year, month, entries, settings, today)
  const prefix = `${year}-${pad(month)}`

  const days: ReportDay[] = summary.days.map(({ date, entry, result }) => ({
    date,
    label: entry && result.booked ? TYPE_LABEL[entry.type] + (entry.half ? ' ½' : '') : '',
    start: entry?.start || undefined,
    end: entry?.end || undefined,
    ist: result.booked ? result.ist : 0,
    diff: result.booked ? result.diff : 0,
    verp: result.verp,
    booked: result.booked,
    missing: summary.missing.includes(date),
  }))

  const receipts = p.receipts
    .filter((r) => r.date.startsWith(prefix))
    .slice()
    .sort((a, b) => (a.date === b.date ? (a.id ?? 0) - (b.id ?? 0) : a.date < b.date ? -1 : 1))
  const byCategory = Object.fromEntries(Object.keys(CATEGORY_LABEL).map((c) => [c, 0])) as Record<Category, number>
  for (const c of Object.keys(byCategory) as Category[]) byCategory[c] = sumAmounts(receipts.filter((r) => r.category === c).map((r) => r.amount))
  const receiptTotal = sumAmounts(receipts.map((r) => r.amount))

  const monthEnd = lastDayOf(year, month)
  const prevEnd = month === 1 ? lastDayOf(year - 1, 12) : lastDayOf(year, month - 1)
  let konto: Report['konto'] = null
  if (monthEnd >= settings.openingDate) {
    const previous = balanceAt(prevEnd, entries, adjustments, settings)
    const end = balanceAt(monthEnd, entries, adjustments, settings)
    konto = { previous, change: end - previous, end }
  }

  const warnings: string[] = []
  if (summary.missing.length) {
    const list = summary.missing.slice(0, 6).map(germanShort).join(', ')
    warnings.push(`${summary.missing.length} ${summary.missing.length === 1 ? 'Werktag' : 'Werktage'} ohne Eintrag: ${list}${summary.missing.length > 6 ? ' …' : ''}`)
  }
  const incomplete = summary.days.filter((d) => d.entry && !d.result.booked).length
  if (incomplete) warnings.push(`${incomplete} ${incomplete === 1 ? 'Tag ist' : 'Tage sind'} unvollständig (Zeiten fehlen).`)
  const bewirtung = receipts.filter((r) => r.category === 'bewirtung' && (!r.anlass?.trim() || !r.personen))
  if (bewirtung.length) warnings.push(`${bewirtung.length} Bewirtungsbeleg${bewirtung.length === 1 ? '' : 'e'} ohne Anlass oder Personenzahl.`)
  const noPhoto = receipts.filter((r) => !r.photo).length
  if (noPhoto) warnings.push(`${noPhoto} ${noPhoto === 1 ? 'Beleg hat' : 'Belege haben'} kein Foto.`)

  return {
    year,
    month,
    title: fromDateKey(`${year}-${pad(month)}-01`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
    name: settings.name,
    days,
    soll: summary.soll,
    ist: summary.ist,
    diff: summary.diff,
    verp: summary.verp,
    verpDays: summary.verpDays,
    verpRate: settings.verpRate,
    receipts,
    byCategory,
    receiptTotal,
    total: sumAmounts([summary.verp, receiptTotal]),
    konto,
    warnings,
  }
}

/** Dateiname ohne Endung, z. B. 'Spesen_2026-10_Adriano-Falcone'. */
export function reportFileBase(r: Pick<Report, 'year' | 'month' | 'name'>): string {
  const who = r.name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `Spesen_${r.year}-${pad(r.month)}${who ? `_${who}` : ''}`
}
