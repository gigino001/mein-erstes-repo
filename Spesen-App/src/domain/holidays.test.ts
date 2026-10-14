import { describe, expect, it } from 'vitest'
import { easterSunday, holidaysNRW } from './holidays'
import { toDateKey } from './time'

describe('Feiertage NRW', () => {
  it('Ostern 2026 und 2027', () => {
    expect(toDateKey(easterSunday(2026))).toBe('2026-04-05')
    expect(toDateKey(easterSunday(2027))).toBe('2027-03-28')
  })
  it('2026 enthält die beweglichen Feiertage', () => {
    const h = holidaysNRW(2026)
    expect(h.get('2026-04-03')).toBe('Karfreitag')
    expect(h.get('2026-04-06')).toBe('Ostermontag')
    expect(h.get('2026-05-14')).toBe('Christi Himmelfahrt')
    expect(h.get('2026-05-25')).toBe('Pfingstmontag')
    expect(h.get('2026-06-04')).toBe('Fronleichnam')
    expect(h.size).toBe(11)
  })
  it('Allerheiligen gilt in NRW, Reformationstag nicht', () => {
    const h = holidaysNRW(2026)
    expect(h.has('2026-11-01')).toBe(true)
    expect(h.has('2026-10-31')).toBe(false)
  })
})
