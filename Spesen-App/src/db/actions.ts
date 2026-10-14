import { finishTimer } from '../domain/timer'
import type { DayEntry, DayType } from '../domain/types'
import { db } from './db'

export async function startTimer(): Promise<void> {
  await db.timer.put({ id: 'main', startedAt: Date.now() })
}

/**
 * Beendet den Timer und speichert den Tag. Ist der Tag ein halber Abwesenheitstag,
 * bleibt sein Typ erhalten und nur die gearbeitete Zeit wird eingetragen.
 * `complete` ist false, wenn über Mitternacht gestempelt wurde und das Ende fehlt.
 */
export async function stopTimer(step: number): Promise<{ date: string; complete: boolean }> {
  const timer = await db.timer.get('main')
  if (!timer) throw new Error('Kein laufender Timer')
  const r = finishTimer(timer.startedAt, Date.now(), step)
  await db.transaction('rw', db.days, db.timer, async () => {
    const existing = await db.days.get(r.date)
    const entry: DayEntry =
      existing?.half && existing.type !== 'arbeit'
        ? { ...existing, start: r.start, end: r.end }
        : { date: r.date, type: 'arbeit', half: false, start: r.start, end: r.end }
    await db.days.put(entry)
    await db.timer.delete('main')
  })
  return { date: r.date, complete: r.end !== undefined }
}

export async function saveDay(entry: DayEntry): Promise<void> {
  await db.days.put(entry)
}

export async function deleteDay(date: string): Promise<void> {
  await db.days.delete(date)
}

/** Trägt einen Tagestyp für mehrere Tage auf einmal ein (ganze Tage). */
export async function saveRange(dates: string[], type: Exclude<DayType, 'arbeit' | 'feiertag'>): Promise<void> {
  await db.days.bulkPut(dates.map((date) => ({ date, type, half: false })))
}
