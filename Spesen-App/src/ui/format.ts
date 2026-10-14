import { fromDateKey } from '../domain/time'
import { WEEKDAY_LONG, WEEKDAY_SHORT } from './labels'

/** 'Do 01.' */
export function shortDate(key: string): string {
  const d = fromDateKey(key)
  return `${WEEKDAY_SHORT[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}.`
}

/** '14.10.2026' */
export function germanDate(key: string): string {
  const [y, m, d] = key.split('-')
  return `${d}.${m}.${y}`
}

/** 'Mittwoch, 14. Oktober' */
export function longDate(key: string): string {
  const d = fromDateKey(key)
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()}. ${d.toLocaleDateString('de-DE', { month: 'long' })}`
}

export function euro0(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: n % 1 === 0 ? 0 : 2 })
}
