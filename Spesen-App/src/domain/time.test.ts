import { describe, expect, it } from 'vitest'
import { formatDuration, formatTime, parseDuration, parseTime, roundToStep, weekdaysOfMonth } from './time'

describe('time', () => {
  it('parst und formatiert Zeiten', () => {
    expect(parseTime('07:45')).toBe(465)
    expect(parseTime('24:00')).toBeNull()
    expect(parseTime('abc')).toBeNull()
    expect(formatTime(465)).toBe('07:45')
  })
  it('formatiert Dauern mit Vorzeichen', () => {
    expect(formatDuration(75, true)).toBe('+1:15')
    expect(formatDuration(-150, true)).toBe('−2:30')
    expect(formatDuration(0, true)).toBe('0:00')
  })
  it('rundet auf 15 Minuten', () => {
    expect(roundToStep(7, 15)).toBe(0)
    expect(roundToStep(8, 15)).toBe(15)
    expect(roundToStep(487, 15)).toBe(480)
  })
  it('Oktober 2026 hat 22 Werktage', () => {
    expect(weekdaysOfMonth(2026, 10)).toHaveLength(22)
  })
  it('parst Dauern mit Vorzeichen', () => {
    expect(parseDuration('12:30')).toBe(750)
    expect(parseDuration('-2:30')).toBe(-150)
    expect(parseDuration('\u22120:45')).toBe(-45)
    expect(parseDuration('+1:05')).toBe(65)
    expect(parseDuration('1:75')).toBeNull()
    expect(parseDuration('abc')).toBeNull()
  })
})
