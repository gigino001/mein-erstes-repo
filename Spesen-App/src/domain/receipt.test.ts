import { describe, expect, it } from 'vitest'
import { formatAmountInput, parseAmountInput, parseReceipt, sumAmounts, vendorKey } from './receipt'
import type { Category } from './types'

const today = '2026-10-14'
const parse = (t: string, rules?: Map<string, Category>) => parseReceipt(t, { today, rules })

describe('parseReceipt', () => {
  it('Tankstelle: Betrag, Datum, Händler, Kategorie', () => {
    const r = parse(`ARAL Tankstelle Köln-Nord
Frankfurter Str. 12
50735 Köln
Datum: 13.10.2026  Uhrzeit 17:42
Super E10   32,41 l   1,689 EUR/l
Betrag EUR                54,90
Summe                     54,90
MwSt 19%   8,77
EC-Karte                  54,90
Vielen Dank`)
    expect(r.amount).toEqual({ value: 54.9, confidence: 'high' })
    expect(r.date).toEqual({ value: '2026-10-13', confidence: 'high' })
    expect(r.vendor).toEqual({ value: 'Aral', confidence: 'high' })
    expect(r.category.value).toBe('sprit')
  })
  it('Parkhaus', () => {
    const r = parse(`Parkhaus Hauptbahnhof
Parkschein 05.10.26
Einfahrt 08:03  Ausfahrt 17:20
Parkdauer 9:17
Zu zahlen 9,50 EUR`)
    expect(r.amount?.value).toBe(9.5)
    expect(r.date?.value).toBe('2026-10-05')
    expect(r.category.value).toBe('parken')
  })
  it('Hotel mit Übernachtung', () => {
    const r = parse(`ibis Köln Messe
Rechnung
Übernachtung 1 Zimmer 6.10.2026
Frühstück 0,00
Gesamtbetrag 89,00 EUR`)
    expect(r.category.value).toBe('hotel')
    expect(r.amount?.value).toBe(89)
    expect(r.vendor?.value).toBe('ibis')
  })
  it('Restaurant ohne Marke: Händler aus erster Zeile, Kategorie Bewirtung', () => {
    const r = parse(`Gasthaus Zum Löwen
Tisch 12 Bedienung Anna
2x Schnitzel   31,80
3x Bier        15,00
Summe          46,80
Bar            50,00
Rückgeld        3,20`)
    expect(r.vendor).toEqual({ value: 'Gasthaus Zum Löwen', confidence: 'medium' })
    expect(r.category.value).toBe('bewirtung')
    expect(r.amount?.value).toBe(46.8)
  })
  it('Baumarkt: Zwischensumme zählt nicht als Total, Rückgeld wird ignoriert', () => {
    const r = parse(`HORNBACH Baumarkt
Schrauben 5x  3,50
Zwischensumme 17,50
SUMME 23,49
Gegeben bar 50,00
Rückgeld 26,51`)
    expect(r.amount?.value).toBe(23.49)
    expect(r.category.value).toBe('material')
  })
  it('OCR-Fehler in Zahlen werden korrigiert', () => {
    const r = parse(`Summe 5O,9O\nDatum 14.1O.2O26`)
    expect(r.amount?.value).toBe(50.9)
    expect(r.date?.value).toBe('2026-10-14')
  })
  it('ohne Schlüsselwort gilt der größte Betrag mit niedriger Sicherheit', () => {
    const r = parse(`Irgendein Laden\nArtikel 3,50\nArtikel 12,00`)
    expect(r.amount).toEqual({ value: 12, confidence: 'low' })
  })
  it('Datum wird nicht als Betrag gelesen', () => {
    expect(parse('Datum 13.10.2026\nSumme 8,50').amount?.value).toBe(8.5)
    expect(parse('Datum 13.10.2026').amount).toBeUndefined()
  })
  it('Datum in der Zukunft oder zu alt wird verworfen', () => {
    expect(parse('Datum 01.01.2030').date).toBeUndefined()
    expect(parse('Datum 01.01.2019').date).toBeUndefined()
    expect(parse('Datum 31.02.2026').date).toBeUndefined()
  })
  it('mehrere verschiedene Daten: erstes gültiges, mittlere Sicherheit', () => {
    const r = parse('Rechnung 13.10.2026\nBestellt am 12.10.2026')
    expect(r.date?.value).toBe('2026-10-13')
    expect(r.date?.confidence).toBe('medium')
  })
  it('gelernte Regel schlägt die Schlüsselwörter', () => {
    const rules = new Map<string, Category>([[vendorKey('Zum Löwen'), 'hotel']])
    expect(parse('Zum Löwen\nRestaurant\nSumme 10,00', rules).category).toEqual({ value: 'hotel', confidence: 'high' })
  })
  it('leerer Text liefert Sonstiges ohne Funde', () => {
    const r = parse('')
    expect(r.amount).toBeUndefined()
    expect(r.date).toBeUndefined()
    expect(r.category).toEqual({ value: 'sonstiges', confidence: 'low' })
  })
})

describe('Beträge', () => {
  it('parseAmountInput', () => {
    expect(parseAmountInput('54,90')).toBe(54.9)
    expect(parseAmountInput('54.90 €')).toBe(54.9)
    expect(parseAmountInput('1.234,56')).toBe(1234.56)
    expect(parseAmountInput('1.234')).toBe(1234)
    expect(parseAmountInput('12')).toBe(12)
    expect(parseAmountInput('abc')).toBeNull()
    expect(parseAmountInput('0')).toBeNull()
    expect(parseAmountInput('-5')).toBeNull()
  })
  it('formatAmountInput zeigt immer zwei Nachkommastellen', () => {
    expect(formatAmountInput(54.9)).toBe('54,90')
    expect(formatAmountInput(1234)).toBe('1234,00')
  })
  it('sumAmounts rundet nicht falsch', () => {
    expect(sumAmounts([0.1, 0.2])).toBe(0.3)
    expect(sumAmounts([78.4, 9.5, 89, 46.8, 23.49, 64.2])).toBe(311.39)
  })
  it('vendorKey', () => {
    expect(vendorKey('Zum Löwen')).toBe('zumlowen')
  })
})
