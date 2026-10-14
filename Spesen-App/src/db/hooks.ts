import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_SETTINGS, type DayEntry, type Settings } from '../domain/types'
import { db } from './db'

export function useSettings(): Settings {
  const row = useLiveQuery(() => db.settings.get('main'))
  return row ?? DEFAULT_SETTINGS
}

export function useDays(): Map<string, DayEntry> {
  const rows = useLiveQuery(() => db.days.toArray())
  return useMemo(() => new Map((rows ?? []).map((d) => [d.date, d])), [rows])
}

/** undefined = lädt noch, null = kein Timer läuft. */
export function useTimer(): { startedAt: number } | null | undefined {
  return useLiveQuery(async () => (await db.timer.get('main')) ?? null)
}

/** Aktuelle Zeit, aktualisiert im gegebenen Takt. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
