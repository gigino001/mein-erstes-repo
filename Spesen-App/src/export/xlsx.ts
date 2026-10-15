import { CATEGORY_LABEL } from '../domain/types'
import type { Report } from '../domain/report'

const hours = (min: number) => Math.round((min / 60) * 100) / 100
const noon = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8)), 12)

/** Excel-Datei mit den Blättern Zusammenfassung, Tage und Belege. */
export async function xlsxBlob(r: Report): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/universal')
  const head = (value: string) => ({ value, fontWeight: 'bold' as const })
  const num = (value: number, format = '0.00') => ({ value, type: Number, format })
  const text = (value: string) => ({ value, type: String })

  const summary = [
    [head('Spesenabrechnung'), text(r.name), text(r.title)],
    [],
    [head('Arbeitszeit')],
    [text('Soll (Std.)'), num(hours(r.soll))],
    [text('Ist (Std.)'), num(hours(r.ist))],
    [text('Differenz (Std.)'), num(hours(r.diff))],
    [],
    [head('Auszahlung')],
    [text(`Verpflegung (${r.verpDays} Tage)`), num(r.verp)],
    ...(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).filter((c) => r.byCategory[c] > 0).map((c) => [text(CATEGORY_LABEL[c]), num(r.byCategory[c])]),
    [text('Summe Belege'), num(r.receiptTotal)],
    [head('Gesamt Auszahlung (EUR)'), { value: r.total, type: Number, format: '0.00', fontWeight: 'bold' as const }],
    ...(r.konto
      ? [[], [head('Stundenkonto')], [text('Vormonat (Std.)'), num(hours(r.konto.previous))], [text('Änderung (Std.)'), num(hours(r.konto.change))], [text('Stand (Std.)'), num(hours(r.konto.end))]]
      : []),
  ]

  const days = [
    ['Datum', 'Art', 'Beginn', 'Ende', 'Ist (Std.)', 'Differenz (Std.)', 'Verpflegung (EUR)'].map(head),
    ...r.days.map((d) => [
      { value: noon(d.date), type: Date, format: 'dd.mm.yyyy' },
      text(d.label || (d.missing ? 'fehlt' : '')),
      text(d.start ?? ''),
      text(d.end ?? ''),
      d.booked ? num(hours(d.ist)) : text(''),
      d.booked ? num(hours(d.diff)) : text(''),
      d.verp ? num(d.verp) : text(''),
    ]),
  ]

  const receipts = [
    ['Nr', 'Datum', 'Händler', 'Kategorie', 'Betrag (EUR)', 'Anlass', 'Personen'].map(head),
    ...r.receipts.map((b, i) => [
      { value: i + 1, type: Number },
      { value: noon(b.date), type: Date, format: 'dd.mm.yyyy' },
      text(b.vendor),
      text(CATEGORY_LABEL[b.category]),
      num(b.amount),
      text(b.anlass ?? ''),
      b.personen ? { value: b.personen, type: Number } : text(''),
    ]),
  ]

  return writeXlsxFile([
    { data: summary as never, sheet: 'Zusammenfassung', columns: [{ width: 28 }, { width: 18 }, { width: 18 }] },
    { data: days as never, sheet: 'Tage', stickyRowsCount: 1, columns: [{ width: 12 }, { width: 12 }, { width: 9 }, { width: 9 }, { width: 11 }, { width: 16 }, { width: 18 }] },
    { data: receipts as never, sheet: 'Belege', stickyRowsCount: 1, columns: [{ width: 5 }, { width: 12 }, { width: 28 }, { width: 16 }, { width: 14 }, { width: 28 }, { width: 10 }] },
  ]).toBlob()
}
