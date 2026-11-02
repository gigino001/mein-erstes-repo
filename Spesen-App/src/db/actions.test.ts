import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { calcDay } from '../domain/calc'
import { DEFAULT_SETTINGS } from '../domain/types'
import { stopTimer } from './actions'
import { db } from './db'

const at = (d: number, h: number, m: number) => new Date(2026, 9, d, h, m).getTime()

beforeEach(async () => {
  await Promise.all([db.days.clear(), db.timer.clear()])
})

describe('stopTimer', () => {
  it('speichert Zeiten gerundet und die Antwort „Ja" als Verpflegung', async () => {
    await db.timer.put({ id: 'main', startedAt: at(14, 7, 52) })
    const r = await stopTimer(15, { at: at(14, 16, 8), verp: 14 })
    expect(r).toEqual({ date: '2026-10-14', complete: true })
    expect(await db.days.get('2026-10-14')).toMatchObject({ type: 'arbeit', start: '07:45', end: '16:15', verpOverride: 14 })
    expect(await db.timer.count()).toBe(0)
  })

  it('„Nein" speichert 0 und überschreibt die automatische Regel', async () => {
    await db.timer.put({ id: 'main', startedAt: at(14, 8, 0) })
    await stopTimer(15, { at: at(14, 17, 30), verp: 0 })
    const e = (await db.days.get('2026-10-14'))!
    expect(e.verpOverride).toBe(0)
    expect(calcDay(e, DEFAULT_SETTINGS).verp).toBe(0) // 9:30 gearbeitet, aber ausdrücklich keine Pauschale
  })

  it('„Ja" gilt auch, wenn die Regel (mehr als 8:00) sie nicht vergeben würde', async () => {
    await db.timer.put({ id: 'main', startedAt: at(14, 8, 0) })
    await stopTimer(15, { at: at(14, 15, 30), verp: 14 })
    expect(calcDay((await db.days.get('2026-10-14'))!, DEFAULT_SETTINGS).verp).toBe(14)
  })

  it('ohne Antwort bleibt die Verpflegung automatisch', async () => {
    await db.timer.put({ id: 'main', startedAt: at(14, 8, 0) })
    await stopTimer(15, { at: at(14, 17, 0) })
    const e = (await db.days.get('2026-10-14'))!
    expect(e.verpOverride).toBeNull()
    expect(calcDay(e, DEFAULT_SETTINGS).verp).toBe(14)
  })

  it('Der Zeitpunkt des Antippens zählt, nicht der der Antwort', async () => {
    await db.timer.put({ id: 'main', startedAt: at(14, 8, 0) })
    await stopTimer(15, { at: at(14, 16, 0), verp: 0 }) // Antwort käme später, Ende bleibt 16:00
    expect((await db.days.get('2026-10-14'))?.end).toBe('16:00')
  })

  it('halber Abwesenheitstag bleibt erhalten und bekommt nie Verpflegung', async () => {
    await db.days.put({ date: '2026-10-14', type: 'urlaub', half: true })
    await db.timer.put({ id: 'main', startedAt: at(14, 8, 0) })
    await stopTimer(15, { at: at(14, 18, 0), verp: 14 })
    const e = (await db.days.get('2026-10-14'))!
    expect(e).toMatchObject({ type: 'urlaub', half: true, start: '08:00', end: '18:00' })
    expect(e.verpOverride).toBeUndefined()
    expect(calcDay(e, DEFAULT_SETTINGS).verp).toBe(0)
  })

  it('über Mitternacht: Ende fehlt, Tag wird trotzdem mit Beginn gespeichert', async () => {
    await db.timer.put({ id: 'main', startedAt: at(13, 8, 0) })
    const r = await stopTimer(15, { at: at(14, 9, 0) })
    expect(r).toEqual({ date: '2026-10-13', complete: false })
    expect((await db.days.get('2026-10-13'))?.end).toBeUndefined()
  })

  it('ohne laufenden Timer: Fehler', async () => {
    await expect(stopTimer(15)).rejects.toThrow('Kein laufender Timer')
  })
})
