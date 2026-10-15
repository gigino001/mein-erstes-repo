import { CATEGORY_LABEL } from '../domain/types'
import type { Report } from '../domain/report'

const hours = (min: number) => String(Math.round((min / 60) * 100) / 100).replace('.', ',')
const money = (n: number) => n.toFixed(2).replace('.', ',')
const dateDe = (key: string) => `${key.slice(8)}.${key.slice(5, 7)}.${key.slice(0, 4)}`

/** Zellen, die mit = + - @ beginnen, würde Excel als Formel lesen. Ein vorangestelltes ' verhindert das. */
function cell(value: string | number): string {
  let s = String(value)
  const isNumber = /^-?\d+(,\d+)?$/.test(s)
  if (typeof value === 'string' && !isNumber && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const line = (cells: (string | number)[]) => cells.map(cell).join(';')

/** CSV für deutsches Excel: Semikolon, Dezimalkomma, Stunden als Dezimalzahl. */
export function buildCsv(r: Report): string {
  const rows: string[] = []
  rows.push(line(['Spesenabrechnung', r.name, r.title]), '')
  rows.push('Tage')
  rows.push(line(['Datum', 'Art', 'Beginn', 'Ende', 'Ist (Std.)', 'Differenz (Std.)', 'Verpflegung (EUR)']))
  for (const d of r.days) {
    rows.push(line([dateDe(d.date), d.label || (d.missing ? 'fehlt' : ''), d.start ?? '', d.end ?? '', d.booked ? hours(d.ist) : '', d.booked ? hours(d.diff) : '', d.verp ? money(d.verp) : '']))
  }
  rows.push('', 'Belege')
  rows.push(line(['Nr', 'Datum', 'Händler', 'Kategorie', 'Betrag (EUR)', 'Anlass', 'Personen']))
  r.receipts.forEach((b, i) => rows.push(line([i + 1, dateDe(b.date), b.vendor, CATEGORY_LABEL[b.category], money(b.amount), b.anlass ?? '', b.personen ?? ''])))
  rows.push('', 'Zusammenfassung')
  rows.push(line(['Soll (Std.)', hours(r.soll)]), line(['Ist (Std.)', hours(r.ist)]), line(['Differenz (Std.)', hours(r.diff)]))
  rows.push(line([`Verpflegung (${r.verpDays} Tage)`, money(r.verp)]), line(['Belege', money(r.receiptTotal)]), line(['Gesamt Auszahlung (EUR)', money(r.total)]))
  if (r.konto) rows.push(line(['Konto Vormonat (Std.)', hours(r.konto.previous)]), line(['Konto Änderung (Std.)', hours(r.konto.change)]), line(['Konto Stand (Std.)', hours(r.konto.end)]))
  return rows.join('\r\n') + '\r\n'
}

/** Mit BOM, damit Excel die Umlaute richtig liest. */
export function csvBlob(r: Report): Blob {
  return new Blob(['﻿', buildCsv(r)], { type: 'text/csv;charset=utf-8' })
}
