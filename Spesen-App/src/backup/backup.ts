import { DEFAULT_SETTINGS, type DayEntry, type DayType, type Category, type Settings } from '../domain/types'
import { db, type AdjustmentRow, type MerchantRule, type ReceiptRow } from '../db/db'

const DAY_TYPES: DayType[] = ['arbeit', 'urlaub', 'krank', 'abbau', 'feiertag']
const CATEGORIES: Category[] = ['sprit', 'parken', 'hotel', 'bewirtung', 'material', 'sonstiges']
const DATE = /^\d{4}-\d{2}-\d{2}$/

interface BackupReceipt extends Omit<ReceiptRow, 'photo'> {
  photo?: { type: string; data: string }
}

export interface BackupFile {
  app: 'spesen-app'
  version: 1
  exportedAt: string
  settings: Settings
  days: DayEntry[]
  receipts: BackupReceipt[]
  adjustments: AdjustmentRow[]
  merchantRules: MerchantRule[]
}

export interface BackupSummary {
  days: number
  receipts: number
  photos: number
  adjustments: number
  exportedAt: string
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let out = ''
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(out)
}

function base64ToBlob(data: string, type: string): Blob {
  return new Blob([Uint8Array.from(atob(data), (c) => c.charCodeAt(0))], { type })
}

/** Liest alle Daten inklusive Belegfotos in eine Sicherungsdatei. */
export async function createBackup(): Promise<{ blob: Blob; filename: string }> {
  const [settings, days, receipts, adjustments, merchantRules] = await Promise.all([
    db.settings.get('main'),
    db.days.toArray(),
    db.receipts.toArray(),
    db.adjustments.toArray(),
    db.merchantRules.toArray(),
  ])
  const { id: _id, ...stored } = settings ?? { id: 'main' as const, ...DEFAULT_SETTINGS }
  const file: BackupFile = {
    app: 'spesen-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS, ...stored },
    days,
    receipts: await Promise.all(receipts.map(async ({ photo, ...r }) => ({ ...r, ...(photo ? { photo: { type: photo.type || 'image/jpeg', data: await blobToBase64(photo) } } : {}) }))),
    adjustments,
    merchantRules,
  }
  return { blob: new Blob([JSON.stringify(file)], { type: 'application/json' }), filename: `Spesen-App-Backup_${file.exportedAt.slice(0, 10)}.json` }
}

const fail = (msg: string): never => {
  throw new Error(msg)
}

/** Prüft eine eingelesene Sicherung und gibt eine bereinigte Fassung zurück. Wirft verständliche Fehler. */
export function validateBackup(input: unknown): BackupFile {
  if (!input || typeof input !== 'object') return fail('Das ist keine Sicherungsdatei.')
  const o = input as Record<string, unknown>
  if (o.app !== 'spesen-app') return fail('Das ist keine Sicherungsdatei der Spesen App.')
  if (o.version !== 1) return fail('Diese Sicherung stammt aus einer neueren Version der App. Bitte aktualisiere die App.')
  for (const k of ['days', 'receipts', 'adjustments', 'merchantRules']) if (!Array.isArray(o[k])) return fail(`Die Sicherung ist beschädigt (${k} fehlt).`)

  const days = (o.days as DayEntry[]).map((d, i) => {
    if (!d || typeof d.date !== 'string' || !DATE.test(d.date) || !DAY_TYPES.includes(d.type)) return fail(`Tag ${i + 1} in der Sicherung ist ungültig.`)
    return { date: d.date, type: d.type, half: !!d.half, start: d.start || undefined, end: d.end || undefined, verpOverride: typeof d.verpOverride === 'number' ? d.verpOverride : null, note: d.note }
  })
  const receipts = (o.receipts as BackupReceipt[]).map((r, i) => {
    if (!r || typeof r.date !== 'string' || !DATE.test(r.date) || !CATEGORIES.includes(r.category) || typeof r.amount !== 'number' || !Number.isFinite(r.amount)) return fail(`Beleg ${i + 1} in der Sicherung ist ungültig.`)
    if (r.photo && (typeof r.photo.data !== 'string' || typeof r.photo.type !== 'string')) return fail(`Das Foto von Beleg ${i + 1} ist beschädigt.`)
    return r
  })
  const adjustments = (o.adjustments as AdjustmentRow[]).map((a, i) => {
    if (!a || typeof a.date !== 'string' || !DATE.test(a.date) || typeof a.minutes !== 'number') return fail(`Buchung ${i + 1} in der Sicherung ist ungültig.`)
    return a
  })
  const merchantRules = (o.merchantRules as MerchantRule[]).filter((m) => m && typeof m.merchant === 'string' && CATEGORIES.includes(m.category))
  const settings = { ...DEFAULT_SETTINGS, ...((o.settings as Partial<Settings>) ?? {}) }
  return { app: 'spesen-app', version: 1, exportedAt: typeof o.exportedAt === 'string' ? o.exportedAt : '', settings, days, receipts, adjustments, merchantRules }
}

export function parseBackup(text: string): BackupFile {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return fail('Die Datei ist keine gültige Sicherung.')
  }
  return validateBackup(json)
}

export function summarize(b: BackupFile): BackupSummary {
  return { days: b.days.length, receipts: b.receipts.length, photos: b.receipts.filter((r) => r.photo).length, adjustments: b.adjustments.length, exportedAt: b.exportedAt }
}

/** Ersetzt alle aktuellen Daten durch die Sicherung (in einem Schritt, bei Fehler bleibt alles unverändert). */
export async function restoreBackup(b: BackupFile): Promise<void> {
  const receipts: ReceiptRow[] = b.receipts.map(({ photo, ...r }) => ({ ...r, ...(photo ? { photo: base64ToBlob(photo.data, photo.type) } : {}) }))
  const lastBackupAt = b.exportedAt ? Date.parse(b.exportedAt) || Date.now() : Date.now()
  await db.transaction('rw', [db.settings, db.days, db.receipts, db.adjustments, db.merchantRules, db.timer], async () => {
    await Promise.all([db.days.clear(), db.receipts.clear(), db.adjustments.clear(), db.merchantRules.clear(), db.timer.clear()])
    await db.settings.put({ id: 'main', ...b.settings, lastBackupAt, backupSnoozeUntil: undefined })
    await db.days.bulkPut(b.days)
    await db.receipts.bulkPut(receipts)
    await db.adjustments.bulkPut(b.adjustments)
    await db.merchantRules.bulkPut(b.merchantRules)
  })
}

export async function markBackedUp(): Promise<void> {
  await db.settings.update('main', { lastBackupAt: Date.now(), backupSnoozeUntil: undefined })
}

export const BACKUP_INTERVAL_DAYS = 30

/** Soll die Erinnerung zur Sicherung erscheinen? */
export function backupDue(p: { settings: Pick<Settings, 'lastBackupAt' | 'backupSnoozeUntil'>; records: number; now: number }): boolean {
  const { settings, records, now } = p
  if (records === 0) return false
  if (settings.backupSnoozeUntil && settings.backupSnoozeUntil > now) return false
  if (!settings.lastBackupAt) return records >= 5
  return now - settings.lastBackupAt > BACKUP_INTERVAL_DAYS * 86400000
}
