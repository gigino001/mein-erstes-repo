import Dexie, { type Table } from 'dexie'
import { DEFAULT_SETTINGS, type Category, type DayEntry, type Settings } from '../domain/types'
import { migrateVacationSettings } from '../domain/vacation'

export interface SettingsRow extends Settings {
  id: 'main'
}
export interface TimerRow {
  id: 'main'
  /** Epoch-Millisekunden des Arbeitsbeginns. */
  startedAt: number
}
export interface ReceiptRow {
  id?: number
  date: string
  vendor: string
  category: Category
  amount: number
  /** Schon ausgezahlt (z. B. direkt im Büro oder aufs Konto überwiesen). Ohne Wert: noch offen. */
  paid?: boolean
  note?: string
  /** Nur Bewirtung */
  anlass?: string
  personen?: number
  photo?: Blob
  ocrText?: string
  createdAt: number
}
export interface AdjustmentRow {
  id?: number
  date: string
  minutes: number
  note?: string
}
export interface MerchantRule {
  merchant: string
  category: Category
}

class SpesenDb extends Dexie {
  settings!: Table<SettingsRow, string>
  days!: Table<DayEntry, string>
  receipts!: Table<ReceiptRow, number>
  timer!: Table<TimerRow, string>
  adjustments!: Table<AdjustmentRow, number>
  merchantRules!: Table<MerchantRule, string>

  constructor() {
    super('spesen-app')
    this.version(1).stores({
      settings: 'id',
      days: 'date',
      receipts: '++id, date, category',
      timer: 'id',
      adjustments: '++id, date',
      merchantRules: 'merchant',
    })
  }
}

export const db = new SpesenDb()

export async function ensureSettings(): Promise<void> {
  const row = await db.settings.get('main')
  if (!row) return void (await db.settings.put({ id: 'main', ...DEFAULT_SETTINGS }))
  // Ältere Urlaubs-Einstellungen einmalig auf „manuell, sonst automatisch" umstellen.
  if (row.vacationVersion !== 2) await db.settings.put({ ...DEFAULT_SETTINGS, ...migrateVacationSettings(row), id: 'main' })
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await ensureSettings()
  await db.settings.update('main', patch)
}

/** Bittet den Browser, die Daten nicht automatisch zu löschen (wichtig auf iOS). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
