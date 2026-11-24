import { describe, expect, it } from 'vitest'
import { daysLabel, formatDays, migrateVacationSettings, parseDays, summarizeVacation, vacationFor, vacationForMonth } from './vacation'
import type { DayEntry } from './types'

const d = (date: string, type: DayEntry['type'], half = false): DayEntry => ({ date, type, half })
const map = (...e: DayEntry[]) => new Map(e.map((x) => [x.date, x]))
const today = '2026-10-14'
const urlaubAm = (...dates: string[]) => map(...dates.map((x) => d(x, 'urlaub')))

describe('Standard: am 1. Januar kommen 30 Tage dazu', () => {
  it('Startjahr: 30 Tage, kein Resturlaub', () => {
    expect(vacationFor({ openingDate: '2026-01-01' }, 2026)).toMatchObject({ entitlement: 30, carryOver: 0, total: 30, manualDays: false, manualCarryOver: false })
  })
  it('Folgejahr: 30 plus der Rest des Vorjahres, automatisch', () => {
    const e = urlaubAm('2026-10-05', '2026-10-06', '2026-10-07')
    expect(vacationFor({ openingDate: '2026-01-01' }, 2027, e)).toMatchObject({ entitlement: 30, carryOver: 27, autoCarryOver: 27, total: 57 })
  })
  it('über mehrere Jahre: der Rest wandert jedes Jahr weiter', () => {
    const e = urlaubAm('2026-10-05', '2027-03-01', '2027-03-02')
    const s = { openingDate: '2026-01-01' }
    expect(vacationFor(s, 2027, e).total).toBe(30 + 29)
    expect(vacationFor(s, 2028, e).total).toBe(30 + (59 - 2))
  })
  it('geplanter (zukünftiger) Urlaub im Vorjahr zählt für den Rest schon mit', () => {
    expect(vacationFor({ openingDate: '2026-01-01' }, 2027, urlaubAm('2026-12-28')).carryOver).toBe(29)
  })
  it('halbe Tage zählen 0,5', () => {
    expect(vacationFor({ openingDate: '2026-01-01' }, 2027, map(d('2026-10-05', 'urlaub', true))).carryOver).toBe(29.5)
  })
  it('Krank, Abfeiern, Wochenenden und Feiertage verbrauchen nichts', () => {
    const e = map(d('2026-10-05', 'krank'), d('2026-10-06', 'abbau'), d('2026-10-10', 'urlaub'), d('2026-10-03', 'urlaub'), d('2026-04-03', 'urlaub'))
    expect(vacationFor({ openingDate: '2026-01-01' }, 2027, e).carryOver).toBe(30)
  })
  it('überzogener Urlaub wird nicht ins nächste Jahr mitgenommen', () => {
    const many = Array.from({ length: 5 }, (_, i) => `2026-10-0${i + 5}`)
    expect(vacationFor({ openingDate: '2026-01-01', vacationDefaultDays: 3 }, 2027, urlaubAm(...many)).carryOver).toBe(0)
  })
  it('der Standard ist einstellbar', () => {
    expect(vacationFor({ openingDate: '2026-01-01', vacationDefaultDays: 28 }, 2026).total).toBe(28)
  })
})

describe('Eintritt mitten im Jahr: manuell eintragen', () => {
  const late = { openingDate: '2026-07-01', vacation: { '2026': { days: 12.5 } } }
  it('manuelle Tage ersetzen den Standard', () => {
    expect(vacationFor(late, 2026)).toMatchObject({ entitlement: 12.5, manualDays: true, defaultDays: 30, total: 12.5 })
  })
  it('im Folgejahr gilt wieder der Standard plus Rest', () => {
    const e = urlaubAm('2026-10-05', '2026-10-06')
    expect(vacationFor(late, 2027, e)).toMatchObject({ entitlement: 30, carryOver: 10.5, total: 40.5, manualDays: false })
  })
  it('Resturlaub lässt sich ebenfalls von Hand setzen und ersetzt den automatischen', () => {
    const s = { openingDate: '2026-01-01', vacation: { '2027': { carryOver: 3 } } }
    expect(vacationFor(s, 2027, urlaubAm('2026-10-05'))).toMatchObject({ carryOver: 3, autoCarryOver: 29, manualCarryOver: true, total: 33 })
  })
  it('manueller Resturlaub 0 (Urlaub verfällt) wird respektiert', () => {
    expect(vacationFor({ openingDate: '2026-01-01', vacation: { '2027': { carryOver: 0 } } }, 2027).carryOver).toBe(0)
  })
  it('vor dem Stichtag gibt es nichts, außer von Hand eingetragen', () => {
    expect(vacationFor({ openingDate: '2026-07-01' }, 2025).total).toBe(0)
    expect(vacationFor({ openingDate: '2026-07-01', vacation: { '2025': { days: 5 } } }, 2025).total).toBe(5)
  })
})

describe('summarizeVacation', () => {
  const s = { openingDate: '2026-01-01', vacation: { '2026': { days: 30, carryOver: 2.5 } } }
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
  it('Wochenenden, Feiertage und andere Jahre zählen nicht', () => {
    const r = summarizeVacation(2026, map(d('2026-10-10', 'urlaub'), d('2026-10-03', 'urlaub'), d('2026-04-03', 'urlaub'), d('2025-10-06', 'urlaub'), d('2027-01-04', 'urlaub')), s, today)
    expect(r.taken).toBe(0)
  })
  it('halber Urlaubstag ohne Zeiten zählt trotzdem', () => {
    expect(summarizeVacation(2026, map(d('2026-10-09', 'urlaub', true)), s, today).taken).toBe(0.5)
  })
  it('kann ins Minus laufen', () => {
    const many = Array.from({ length: 4 }, (_, i) => d(`2026-10-0${i + 5}`, 'urlaub'))
    expect(summarizeVacation(2026, map(...many), { openingDate: '2026-01-01', vacation: { '2026': { days: 3, carryOver: 0 } } }, today).remaining).toBe(-1)
  })
  it('Standard 0 und nichts eingetragen: kein Anspruch', () => {
    expect(summarizeVacation(2026, map(), { openingDate: '2026-01-01', vacationDefaultDays: 0 }, today)).toMatchObject({ unset: true, total: 0, remaining: 0 })
  })
  it('ohne jede Einstellung gilt der Standard von 30 Tagen', () => {
    expect(summarizeVacation(2026, map(), {}, today)).toMatchObject({ unset: false, total: 30, remaining: 30 })
  })
})

describe('vacationForMonth', () => {
  const v = { openingDate: '2026-01-01', vacation: { '2026': { days: 30, carryOver: 2 } } }
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
  it('Folgejahr im Januar: Standard plus automatischer Rest', () => {
    expect(vacationForMonth(2027, 1, e, { openingDate: '2026-01-01' })).toMatchObject({ entitlement: 30, carryOver: 26, total: 56 })
  })
})

describe('Umstellung älterer Einstellungen', () => {
  it('alte Einträge werden zu manuellen Werten, Resturlaub 0 hieß „nichts eingetragen"', () => {
    const m = migrateVacationSettings({ vacation: { '2026': { days: 28, carryOver: 0 }, '2027': { days: 30, carryOver: 2.5 } } })
    expect(m.vacation).toEqual({ '2026': { days: 28 }, '2027': { days: 30, carryOver: 2.5 } })
    expect(m.vacationVersion).toBe(2)
  })
  it('der Anspruch des letzten Jahres wird zum Standard, wenn keiner gesetzt war', () => {
    expect(migrateVacationSettings({ vacation: { '2025': { days: 26 }, '2026': { days: 28 } } }).vacationDefaultDays).toBe(28)
    expect(migrateVacationSettings({ vacation: { '2026': { days: 28 } }, vacationDefaultDays: 30 }).vacationDefaultDays).toBe(30)
  })
  it('ohne alte Daten: leer und ohne Standardwert (der kommt aus den Vorgaben)', () => {
    const m = migrateVacationSettings({})
    expect(m.vacation).toEqual({})
    expect('vacationDefaultDays' in m).toBe(false)
  })
  it('bereits umgestellte Daten bleiben unverändert', () => {
    const s = { vacation: { '2026': { carryOver: 0 } }, vacationVersion: 2 }
    expect(migrateVacationSettings(s)).toBe(s)
  })
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

describe('daysLabel', () => {
  it('Einzahl und Mehrzahl', () => {
    expect(daysLabel(1)).toBe('1 Tag')
    expect(daysLabel(2.5)).toBe('2,5 Tage')
    expect(daysLabel(0)).toBe('0 Tage')
    expect(daysLabel(-1)).toBe('-1 Tag')
  })
})
