import { toDateKey } from './time'

/** Ostersonntag (Gaußsche Osterformel, anonymer gregorianischer Algorithmus). */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day, 12)
}

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12)

/** Gesetzliche Feiertage in Nordrhein-Westfalen. Schlüssel: 'YYYY-MM-DD'. */
export function holidaysNRW(year: number): Map<string, string> {
  const easter = easterSunday(year)
  const h = new Map<string, string>()
  const set = (d: Date, name: string) => h.set(toDateKey(d), name)
  set(new Date(year, 0, 1, 12), 'Neujahr')
  set(addDays(easter, -2), 'Karfreitag')
  set(addDays(easter, 1), 'Ostermontag')
  set(new Date(year, 4, 1, 12), 'Tag der Arbeit')
  set(addDays(easter, 39), 'Christi Himmelfahrt')
  set(addDays(easter, 50), 'Pfingstmontag')
  set(addDays(easter, 60), 'Fronleichnam')
  set(new Date(year, 9, 3, 12), 'Tag der Deutschen Einheit')
  set(new Date(year, 10, 1, 12), 'Allerheiligen')
  set(new Date(year, 11, 25, 12), '1. Weihnachtstag')
  set(new Date(year, 11, 26, 12), '2. Weihnachtstag')
  return h
}
