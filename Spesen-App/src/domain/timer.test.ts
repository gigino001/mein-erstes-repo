import { describe, expect, it } from 'vitest'
import { elapsedMinutes, finishTimer } from './timer'

const at = (d: number, h: number, m: number, s = 0) => new Date(2026, 9, d, h, m, s).getTime()

describe('finishTimer', () => {
  it('rundet Beginn und Ende auf 15 Minuten', () => {
    expect(finishTimer(at(14, 7, 52), at(14, 16, 8), 15)).toEqual({ date: '2026-10-14', start: '07:45', end: '16:15' })
  })
  it('Ende fehlt, wenn über Mitternacht gestempelt wurde', () => {
    expect(finishTimer(at(13, 8, 0), at(14, 9, 0), 15)).toEqual({ date: '2026-10-13', start: '08:00', end: undefined })
  })
  it('rundet nie auf 24:00', () => {
    expect(finishTimer(at(14, 23, 50), at(14, 23, 58), 15).end).toBe('23:45')
  })
})

describe('elapsedMinutes', () => {
  it('zählt volle Minuten und nie negativ', () => {
    expect(elapsedMinutes(at(14, 8, 0), at(14, 8, 0, 59))).toBe(0)
    expect(elapsedMinutes(at(14, 8, 0), at(14, 9, 30))).toBe(90)
    expect(elapsedMinutes(at(14, 9, 0), at(14, 8, 0))).toBe(0)
  })
})
