import { formatTime, roundToStep, toDateKey } from './time'

export interface TimerResult {
  /** Tag, an dem gestempelt wurde. */
  date: string
  start: string
  /** undefined, wenn über Mitternacht hinaus gestempelt wurde (Ende muss nachgetragen werden). */
  end: string | undefined
}

const clamp = (minutes: number, step: number) => Math.min(minutes, 24 * 60 - step)
const minuteOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes()

/** Wandelt Start-/Stopp-Zeitpunkt in gerundete Tageszeiten um. */
export function finishTimer(startedAt: number, now: number, step: number): TimerResult {
  const s = new Date(startedAt)
  const n = new Date(now)
  const date = toDateKey(s)
  const start = formatTime(clamp(roundToStep(minuteOfDay(s), step), step))
  if (toDateKey(n) !== date) return { date, start, end: undefined }
  return { date, start, end: formatTime(clamp(roundToStep(minuteOfDay(n), step), step)) }
}

export function elapsedMinutes(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / 60000))
}
