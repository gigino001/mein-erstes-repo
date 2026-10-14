import { describe, expect, it } from 'vitest'
import { balanceAt, calcDay, summarizeMonth } from './calc'
import { DEFAULT_SETTINGS, type DayEntry } from './types'

const s = { ...DEFAULT_SETTINGS, openingBalance: 750, openingDate: '2026-07-01' }
const day = (date: string, type: DayEntry['type'], half = false, start?: string, end?: string): DayEntry => ({
  date, type, half, start, end,
})

describe('calcDay', () => {
  it('Arbeitstag: Differenz zum Soll und Verpflegung ab 8 h', () => {
    const r = calcDay(day('2026-10-01', 'arbeit', false, '07:45', '17:00'), s)
    expect(r.ist).toBe(555)
    expect(r.diff).toBe(75)
    expect(r.verp).toBe(14)
  })
  it('genau 8 h gibt Verpflegung, 7:59 nicht', () => {
    expect(calcDay(day('2026-10-02', 'arbeit', false, '08:00', '16:00'), s).verp).toBe(14)
    expect(calcDay(day('2026-10-02', 'arbeit', false, '08:00', '15:59'), s).verp).toBe(0)
  })
  it('Urlaub und Krank ganztags: Saldo ±0, keine Verpflegung', () => {
    for (const t of ['urlaub', 'krank'] as const) {
      const r = calcDay(day('2026-10-02', t), s)
      expect(r.booked).toBe(true)
      expect(r.diff).toBe(0)
      expect(r.verp).toBe(0)
    }
  })
  it('Überstunden abfeiern ganztags: −Soll', () => {
    expect(calcDay(day('2026-10-08', 'abbau'), s).diff).toBe(-480)
  })
  it('halber Tag Abfeiern + 4 h gearbeitet: −4 h', () => {
    expect(calcDay(day('2026-10-08', 'abbau', true, '08:00', '12:00'), s).diff).toBe(-240)
  })
  it('halber Urlaub + 4 h gearbeitet: Saldo ±0', () => {
    const r = calcDay(day('2026-10-09', 'urlaub', true, '08:00', '12:00'), s)
    expect(r.ist).toBe(480)
    expect(r.diff).toBe(0)
  })
  it('halber Tag ohne Zeiten bleibt offen', () => {
    expect(calcDay(day('2026-10-09', 'urlaub', true), s).booked).toBe(false)
  })
  it('Arbeitstag ohne Zeiten oder mit Ende vor Beginn zählt nicht', () => {
    expect(calcDay(day('2026-10-09', 'arbeit'), s).booked).toBe(false)
    const r = calcDay(day('2026-10-09', 'arbeit', false, '17:00', '08:00'), s)
    expect(r.booked).toBe(false)
    expect(r.invalid).toBe(true)
  })
  it('Verpflegung lässt sich überschreiben', () => {
    expect(calcDay({ ...day('2026-10-01', 'arbeit', false, '08:00', '17:00'), verpOverride: 0 }, s).verp).toBe(0)
  })
})

describe('Monat Oktober 2026 (Prototyp-Beispiel)', () => {
  const entries = new Map<string, DayEntry>(
    [
      day('2026-10-01', 'arbeit', false, '07:45', '17:00'),
      day('2026-10-02', 'urlaub'),
      day('2026-10-05', 'arbeit', false, '08:00', '17:30'),
      day('2026-10-06', 'arbeit', false, '08:00', '16:30'),
      day('2026-10-07', 'krank'),
      day('2026-10-08', 'abbau'),
      day('2026-10-09', 'urlaub', true, '08:00', '12:00'),
      day('2026-10-12', 'arbeit', false, '08:00', '17:00'),
      day('2026-10-13', 'arbeit', false, '07:30', '16:45'),
    ].map((e) => [e.date, e]),
  )
  const m = summarizeMonth(2026, 10, entries, s, '2026-10-14')
  it('Differenz, Verpflegung und Konto', () => {
    expect(m.diff).toBe(-150)
    expect(m.verp).toBe(70)
    expect(m.verpDays).toBe(5)
    expect(balanceAt('2026-10-31', entries, [], s)).toBe(600)
  })
  it('meldet keine fehlenden Tage, wenn alles bis gestern erfasst ist', () => {
    expect(m.missing).toEqual([])
  })
  it('meldet fehlende vergangene Werktage', () => {
    const fewer = new Map(entries)
    fewer.delete('2026-10-06')
    expect(summarizeMonth(2026, 10, fewer, s, '2026-10-14').missing).toEqual(['2026-10-06'])
  })
  it('Korrekturbuchungen und Datum-Grenze beim Saldo', () => {
    expect(balanceAt('2026-10-31', entries, [{ date: '2026-10-10', minutes: 60 }], s)).toBe(660)
    expect(balanceAt('2026-10-05', entries, [], s)).toBe(750 + 75 + 90)
  })
})
