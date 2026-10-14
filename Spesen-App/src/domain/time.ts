const pad = (n: number) => String(n).padStart(2, '0')

/** 'HH:MM' → Minuten seit Mitternacht. Ungültig → null. */
export function parseTime(t: string | undefined | null): number | null {
  if (!t) return null
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function formatTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

/** Dauer als H:MM, optional mit Vorzeichen (+/−). */
export function formatDuration(minutes: number, withSign = false): string {
  const abs = Math.abs(minutes)
  const sign = minutes < 0 ? '−' : withSign && minutes > 0 ? '+' : ''
  return `${sign}${Math.floor(abs / 60)}:${pad(abs % 60)}`
}

export function roundToStep(minutes: number, step: number): number {
  return Math.round(minutes / step) * step
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 'YYYY-MM-DD' → Date mittags lokal (vermeidet Zeitzonen-Sprünge). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d, 12)
}

/** 0 = Sonntag … 6 = Samstag */
export function weekdayOf(key: string): number {
  return fromDateKey(key).getDay()
}

export function isWeekday(key: string): boolean {
  const w = weekdayOf(key)
  return w >= 1 && w <= 5
}

/** Alle Werktage (Mo–Fr) eines Monats. month: 1–12. */
export function weekdaysOfMonth(year: number, month: number): string[] {
  const out: string[] = []
  const days = new Date(year, month, 0).getDate()
  for (let d = 1; d <= days; d++) {
    const key = `${year}-${pad(month)}-${pad(d)}`
    if (isWeekday(key)) out.push(key)
  }
  return out
}

export function formatEuro(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
}
