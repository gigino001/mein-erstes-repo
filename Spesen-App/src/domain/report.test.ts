import { describe, expect, it } from 'vitest'
import { buildReport, reportFileBase, type ReceiptLike } from './report'
import { DEFAULT_SETTINGS, type DayEntry } from './types'

const s = { ...DEFAULT_SETTINGS, openingBalance: 750, openingDate: '2026-07-01' }
const d = (date: string, type: DayEntry['type'], half = false, start?: string, end?: string): DayEntry => ({ date, type, half, start, end })
const entries = new Map<string, DayEntry>(
  [
    d('2026-10-01', 'arbeit', false, '07:45', '17:00'),
    d('2026-10-02', 'urlaub'),
    d('2026-10-05', 'arbeit', false, '08:00', '17:30'),
    d('2026-10-06', 'arbeit', false, '08:00', '16:30'),
    d('2026-10-07', 'krank'),
    d('2026-10-08', 'abbau'),
    d('2026-10-09', 'urlaub', true, '08:00', '12:00'),
    d('2026-10-12', 'arbeit', false, '08:00', '17:00'),
    d('2026-10-13', 'arbeit', false, '07:30', '16:45'),
  ].map((e) => [e.date, e]),
)
const photo = new Blob(['x'])
const receipts: ReceiptLike[] = [
  { id: 1, date: '2026-10-01', vendor: 'Aral', category: 'sprit', amount: 78.4, photo },
  { id: 4, date: '2026-10-06', vendor: 'Zum Löwen', category: 'bewirtung', amount: 46.8, anlass: 'Kundentermin', personen: 3, photo },
  { id: 2, date: '2026-10-05', vendor: 'Parkhaus', category: 'parken', amount: 9.5, photo },
  { id: 9, date: '2026-09-30', vendor: 'Vormonat', category: 'sonstiges', amount: 99, photo },
]
const base = { year: 2026, month: 10, entries, receipts, adjustments: [], settings: s, today: '2026-10-14' }

describe('buildReport Oktober 2026', () => {
  const r = buildReport(base)
  it('Zeit, Verpflegung und Konto', () => {
    expect(r.title).toBe('Oktober 2026')
    expect([r.soll, r.ist, r.diff]).toEqual([9 * 480, 9 * 480 - 150, -150])
    expect(r.verp).toBe(70)
    expect(r.verpDays).toBe(5)
    expect(r.konto).toEqual({ previous: 750, change: -150, end: 600 })
  })
  it('Belege nur aus dem Monat, nach Datum sortiert, Summen je Kategorie', () => {
    expect(r.receipts.map((x) => x.vendor)).toEqual(['Aral', 'Parkhaus', 'Zum Löwen'])
    expect(r.byCategory).toMatchObject({ sprit: 78.4, parken: 9.5, bewirtung: 46.8, hotel: 0, material: 0, sonstiges: 0 })
    expect(r.receiptTotal).toBe(134.7)
    expect(r.total).toBe(204.7)
  })
  it('Tageszeilen mit Beschriftung', () => {
    const half = r.days.find((x) => x.date === '2026-10-09')!
    expect(half).toMatchObject({ label: 'Urlaub ½', ist: 480, diff: 0, verp: 0 })
    expect(r.days.find((x) => x.date === '2026-10-14')).toMatchObject({ label: '', booked: false })
  })
  it('Hinweise: fehlende Tage zählen vergangene Werktage ohne Eintrag', () => {
    expect(r.warnings).toEqual([])
    const fewer = new Map(entries)
    fewer.delete('2026-10-06')
    const w = buildReport({ ...base, entries: fewer }).warnings
    expect(w[0]).toContain('1 Werktag ohne Eintrag: 06.10.')
  })
  it('Hinweise: Bewirtung ohne Anlass und Beleg ohne Foto', () => {
    const rc = [{ id: 1, date: '2026-10-06', vendor: 'X', category: 'bewirtung' as const, amount: 10 }]
    const w = buildReport({ ...base, receipts: rc }).warnings
    expect(w).toContain('1 Bewirtungsbeleg ohne Anlass oder Personenzahl.')
    expect(w).toContain('1 Beleg hat kein Foto.')
  })
  it('Monat vor dem Stichtag hat kein Konto', () => {
    expect(buildReport({ ...base, month: 6 }).konto).toBeNull()
  })
  it('Dateiname', () => {
    expect(reportFileBase(r)).toBe('Spesen_2026-10_Adriano-Falcone')
    expect(reportFileBase({ year: 2026, month: 3, name: 'Jörg Müller' })).toBe('Spesen_2026-03_Jorg-Muller')
  })
})
