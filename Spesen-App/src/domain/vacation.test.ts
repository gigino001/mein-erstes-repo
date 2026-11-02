import { describe, expect, it } from 'vitest'
import { daysLabel, formatDays, parseDays, summarizeVacation, vacationFor, vacationForMonth } from './vacation'
import type { DayEntry } from './types'

const d = (date: string, type: DayEntry['type'], half = false): DayEntry => ({ date, type, half })
const map = (...e: DayEntry[]) => new Map(e.map((x) => [x.date, x]))
const s = { vacation: { '2026': { days: 30, carryOver: 2.5 } } }
const today = '2026-10-14'

describe('summarizeVacation', () => {
  it('zählt ganze und halbe Urlaubstage, getrennt nach genommen und geplant', () => {
    const r = summarizeVacation(
      2026,
      map(d('2026-10-05', 'urlaub'), d('2026-10-06', 'urlaub'), d('2026-10-09', 'urlaub', true), d('2026-10-14', 'urlaub'), d('2026-10-20', 'urlaub'), d('2026-12-28', 'urlaub', true)),
      s,
      today,
    )
    expect(r).toMatchObject({ entitlement: 30, carryOver: 2.5, total: 32.5, taken: 3.5, planned: 1.5, remaining: 27.5, unset: false })
  })
  it('Krank, Abfeiern und Arbeit verbrauchen keinen Urlaub', () => {
    const r = summarizeVacation(2026, map(d('2026-10-05', 'krank'), d('2026-10-06', 'abbau'), d('2026-10-07', 'abbau', true), d('2026-10-08', 'arbeit')), s, today)
    expect(r.taken + r.planned).toBe(0)
    expect(r.remaining).toBe(32.5)
  })
  it('Wochenenden und Feiertage zählen nicht, andere Jahre auch nicht', () => {
    const r = summarizeVacation(
      2026,
      map(d('2026-10-10', 'urlaub'), d('2026-10-03', 'urlaub'), d('2026-04-03', 'urlaub'), d('2025-10-06', 'urlaub'), d('2027-01-04', 'urlaub')),
      s,
      today,
    )
    expect(r.taken).toBe(0)
  })
  it('halber Urlaubstag ohne Zeiten zählt trotzdem', () => {
    expect(summarizeVacation(2026, map(d('2026-10-09', 'urlaub', true)), s, today).taken).toBe(0.5)
  })
  it('kann ins Minus laufen', () => {
    const many = Array.from({ length: 4 }, (_, i) => d(`2026-10-0${i + 5}`, 'urlaub'))
    expect(summarizeVacation(2026, map(...many), { vacation: { '2026': { days: 3, carryOver: 0 } } }, today).remaining).toBe(-1)
  })
  it('ohne Eintrag: nicht eingetragen', () => {
    expect(summarizeVacation(2026, map(), {}, today)).toMatchObject({ unset: true, total: 0, remaining: 0 })
  })
})

describe('vacationFor', () => {
  const v = { vacation: { '2025': { days: 28, carryOver: 4 }, '2027': { days: 30, carryOver: 1 } } }
  it('eigener Eintrag gewinnt', () => expect(vacationFor(v, 2027)).toEqual({ days: 30, carryOver: 1 }))
  it('Jahr ohne Eintrag erbt den Anspruch des letzten früheren Jahres, ohne Resturlaub', () => {
    expect(vacationFor(v, 2026)).toEqual({ days: 28, carryOver: 0 })
    expect(vacationFor(v, 2030)).toEqual({ days: 30, carryOver: 0 })
  })
  it('vor dem ersten Eintrag: 0', () => expect(vacationFor(v, 2024)).toEqual({ days: 0, carryOver: 0 }))
})

describe('Tage ein- und ausgeben', () => {
  it('formatDays', () => {
    expect(formatDays(30)).toBe('30')
    expect(formatDays(18.5)).toBe('18,5')
    expect(formatDays(-1)).toBe('-1')
  })
  it('parseDays', () => {
    expect(parseDays('30')).toBe(30)
    expect(parseDays('27,5')).toBe(27.5)
    expect(parseDays('27.2')).toBe(27)
    expect(parseDays('')).toBeNull()
    expect(parseDays('-3')).toBeNull()
    expect(parseDays('abc')).toBeNull()
  })
})

describe('vacationForMonth', () => {
  const v = { vacation: { '2026': { days: 30, carryOver: 2 } } }
  const e = map(
    d('2026-09-10', 'urlaub'),
    d('2026-10-02', 'urlaub'),
    d('2026-10-09', 'urlaub', true),
    d('2026-10-13', 'krank'),
    d('2026-12-28', 'urlaub'),
    d('2026-12-29', 'urlaub', true),
  )
  it('im Monat, bis Monatsende und danach', () => {
    expect(vacationForMonth(2026, 10, e, v)).toMatchObject({ total: 32, inMonth: 1.5, untilMonthEnd: 2.5, afterMonth: 1.5, remaining: 29.5, unset: false })
  })
  it('Vormonat kennt nur den Urlaub bis dahin', () => {
    expect(vacationForMonth(2026, 9, e, v)).toMatchObject({ inMonth: 1, untilMonthEnd: 1, afterMonth: 3, remaining: 31 })
  })
  it('Dezember: alles im Jahr', () => {
    expect(vacationForMonth(2026, 12, e, v)).toMatchObject({ inMonth: 1.5, untilMonthEnd: 4, afterMonth: 0, remaining: 28 })
  })
  it('ohne Anspruch: unset', () => expect(vacationForMonth(2026, 10, e, {}).unset).toBe(true))
})

describe('daysLabel', () => {
  it('Einzahl und Mehrzahl', () => {
    expect(daysLabel(1)).toBe('1 Tag')
    expect(daysLabel(2.5)).toBe('2,5 Tage')
    expect(daysLabel(0)).toBe('0 Tage')
    expect(daysLabel(-1)).toBe('-1 Tag')
  })
})
