import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DayEntry, Settings } from '../domain/types'
import { db, type AdjustmentRow } from './db'

interface Data {
  settings: Settings
  days: Map<string, DayEntry>
  timer: { startedAt: number } | null
  adjustments: AdjustmentRow[]
}

const DataContext = createContext<Data | null>(null)

/**
 * Lädt Einstellungen, Tage, Timer und Buchungen einmal zentral und zeigt die App erst,
 * wenn alles da ist. So erscheinen nie kurz falsche Werte (z. B. Saldo 0:00).
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const settingsRow = useLiveQuery(() => db.settings.get('main'))
  const dayRows = useLiveQuery(() => db.days.toArray())
  const timer = useLiveQuery(async () => (await db.timer.get('main')) ?? null)
  const adjustments = useLiveQuery(() => db.adjustments.orderBy('date').toArray())
  const days = useMemo(() => new Map((dayRows ?? []).map((d) => [d.date, d])), [dayRows])

  if (!settingsRow || !dayRows || timer === undefined || !adjustments) return <div className="app" aria-busy="true" />
  const { id: _id, ...settings } = settingsRow
  return <DataContext.Provider value={{ settings, days, timer, adjustments }}>{children}</DataContext.Provider>
}

function useData(): Data {
  const d = useContext(DataContext)
  if (!d) throw new Error('DataProvider fehlt')
  return d
}

export const useSettings = () => useData().settings
export const useDays = () => useData().days
export const useTimer = () => useData().timer
export const useAdjustments = () => useData().adjustments

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

/** Beleg-Fotos nur als Objekt-URL halten, solange die Komponente sie anzeigt. */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return setUrl(undefined)
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}
