import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { buildReport, type ReceiptLike } from '../domain/report'
import { DEFAULT_SETTINGS, type DayEntry } from '../domain/types'
import { buildCsv, csvBlob } from './csv'
import { buildPdf } from './pdf'
import { xlsxBlob } from './xlsx'

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
const receipts: ReceiptLike[] = [
  { id: 1, date: '2026-10-01', vendor: 'Aral Tankstelle', category: 'sprit', amount: 78.4 },
  { id: 2, date: '2026-10-05', vendor: 'Parkhaus "Hbf"; Köln', category: 'parken', amount: 9.5 },
  { id: 3, date: '2026-10-06', vendor: '=HYPERLINK("x")', category: 'bewirtung', amount: 46.8, anlass: 'Kundentermin Müller GmbH', personen: 3 },
]
const report = (r: ReceiptLike[]) => buildReport({ year: 2026, month: 10, entries, receipts: r, adjustments: [], settings: s, today: '2026-10-14' })

// 1x1-JPEG, nur um den Einbettungsweg zu prüfen
const JPEG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='), (c) => c.charCodeAt(0))

describe('PDF', () => {
  it('ohne Belege: Zusammenfassung und Tagesübersicht', async () => {
    const bytes = await buildPdf(report([]))
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(2)
    expect(doc.getTitle()).toContain('Oktober 2026')
  })
  it('mit Belegen: Übersicht und zwei Fotoseiten, auch bei Sonderzeichen', async () => {
    const r = report([...receipts, { id: 4, date: '2026-10-12', vendor: 'Emoji \u{1F600} Laden', category: 'material', amount: 5 }])
    const bytes = await buildPdf(r, [JPEG, undefined, JPEG, JPEG])
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(2 + 1 + 2)
  })
})

describe('CSV', () => {
  const csv = buildCsv(report(receipts))
  it('Semikolon, Dezimalkomma und Stunden als Dezimalzahl', () => {
    expect(csv).toContain('Datum;Art;Beginn;Ende;Ist (Std.);Differenz (Std.);Verpflegung (EUR)')
    expect(csv).toContain('01.10.2026;Arbeit;07:45;17:00;9,25;1,25;14,00')
    expect(csv).toContain('08.10.2026;Abfeiern;;;0;-8;')
    expect(csv).toContain('Gesamt Auszahlung (EUR);204,70')
    expect(csv).toContain('Konto Stand (Std.);10')
  })
  it('maskiert Semikolon, Anführungszeichen und Formeln', () => {
    expect(csv).toContain('"Parkhaus ""Hbf""; Köln"')
    expect(csv).toContain("'=HYPERLINK")
  })
  it('Blob beginnt mit BOM', async () => {
    const head = new Uint8Array(await csvBlob(report([])).slice(0, 3).arrayBuffer())
    expect([...head]).toEqual([0xef, 0xbb, 0xbf])
  })
})

describe('Excel', () => {
  it('liefert eine gültige xlsx-Datei (ZIP)', async () => {
    const blob = await xlsxBlob(report(receipts))
    const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer())
    expect(String.fromCharCode(...head)).toBe('PK')
    expect(blob.size).toBeGreaterThan(2000)
  })
})
