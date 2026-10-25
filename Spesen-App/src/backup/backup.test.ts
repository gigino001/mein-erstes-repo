import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, ensureSettings } from '../db/db'
import { backupDue, createBackup, markBackedUp, parseBackup, restoreBackup, summarize, validateBackup } from './backup'

const now = Date.parse('2026-10-14T12:00:00Z')
const DAY = 86400000

async function seed() {
  await ensureSettings()
  await db.settings.update('main', { openingBalance: 750, openingDate: '2026-07-01', mailTo: 'a@b.de' })
  await db.days.bulkPut([
    { date: '2026-10-01', type: 'arbeit', half: false, start: '07:45', end: '17:00' },
    { date: '2026-10-09', type: 'urlaub', half: true, start: '08:00', end: '12:00', verpOverride: 0 },
  ])
  await db.receipts.add({ date: '2026-10-06', vendor: 'Zum Löwen', category: 'bewirtung', amount: 46.8, anlass: 'Termin', personen: 3, photo: new Blob([new Uint8Array([255, 216, 255, 224, 1, 2, 3, 250])], { type: 'image/jpeg' }), createdAt: 1 })
  await db.receipts.add({ date: '2026-10-07', vendor: 'Ohne Foto', category: 'sonstiges', amount: 5, createdAt: 2 })
  await db.adjustments.add({ date: '2026-10-10', minutes: -60, note: 'Auszahlung' })
  await db.merchantRules.put({ merchant: 'zumlowen', category: 'bewirtung' })
}

beforeEach(async () => {
  await Promise.all([db.settings.clear(), db.days.clear(), db.receipts.clear(), db.adjustments.clear(), db.merchantRules.clear(), db.timer.clear()])
})

describe('Sicherung und Wiederherstellung', () => {
  it('Rundlauf: alles kommt identisch zurück, auch das Foto', async () => {
    await seed()
    const { blob, filename } = await createBackup()
    expect(filename).toMatch(/^Spesen-App-Backup_\d{4}-\d{2}-\d{2}\.json$/)
    const backup = parseBackup(await blob.text())
    expect(summarize(backup)).toMatchObject({ days: 2, receipts: 2, photos: 1, adjustments: 1 })

    await Promise.all([db.days.clear(), db.receipts.clear(), db.adjustments.clear(), db.merchantRules.clear(), db.settings.clear()])
    await restoreBackup(backup)

    expect((await db.days.toArray()).map((d) => d.date)).toEqual(['2026-10-01', '2026-10-09'])
    expect((await db.days.get('2026-10-09'))?.verpOverride).toBe(0)
    const rc = await db.receipts.toArray()
    expect(rc.map((r) => r.vendor)).toEqual(['Zum Löwen', 'Ohne Foto'])
    expect(rc[0]?.anlass).toBe('Termin')
    expect(rc[1]?.photo).toBeUndefined()
    const bytes = new Uint8Array(await rc[0]!.photo!.arrayBuffer())
    expect([...bytes]).toEqual([255, 216, 255, 224, 1, 2, 3, 250])
    expect(rc[0]?.photo?.type).toBe('image/jpeg')
    expect((await db.adjustments.toArray())[0]).toMatchObject({ minutes: -60, note: 'Auszahlung' })
    expect(await db.merchantRules.count()).toBe(1)
    const s = await db.settings.get('main')
    expect(s).toMatchObject({ openingBalance: 750, mailTo: 'a@b.de' })
    expect(s?.lastBackupAt).toBeGreaterThan(0)
  })

  it('Wiederherstellen ersetzt vorhandene Daten und löscht einen laufenden Timer', async () => {
    await seed()
    const { blob } = await createBackup()
    await db.days.put({ date: '2026-10-20', type: 'krank', half: false })
    await db.timer.put({ id: 'main', startedAt: 123 })
    await restoreBackup(parseBackup(await blob.text()))
    expect(await db.days.get('2026-10-20')).toBeUndefined()
    expect(await db.timer.count()).toBe(0)
  })

  it('markBackedUp setzt den Zeitpunkt', async () => {
    await ensureSettings()
    await markBackedUp()
    expect((await db.settings.get('main'))?.lastBackupAt).toBeGreaterThan(Date.now() - 5000)
  })
})

describe('Prüfung', () => {
  const ok = { app: 'spesen-app', version: 1, exportedAt: '2026-10-14T10:00:00Z', settings: {}, days: [], receipts: [], adjustments: [], merchantRules: [] }
  it('akzeptiert eine leere, gültige Sicherung', () => {
    expect(validateBackup(ok).days).toEqual([])
  })
  it('lehnt Fremdes, neuere Versionen und Kaputtes mit verständlicher Meldung ab', () => {
    expect(() => parseBackup('kein json')).toThrow('keine gültige Sicherung')
    expect(() => validateBackup(null)).toThrow('keine Sicherungsdatei')
    expect(() => validateBackup({ ...ok, app: 'x' })).toThrow('der Spesen App')
    expect(() => validateBackup({ ...ok, version: 2 })).toThrow('neueren Version')
    expect(() => validateBackup({ ...ok, days: undefined })).toThrow('days fehlt')
    expect(() => validateBackup({ ...ok, days: [{ date: 'x', type: 'arbeit' }] })).toThrow('Tag 1')
    expect(() => validateBackup({ ...ok, receipts: [{ date: '2026-10-01', category: 'sprit', amount: 'viel' }] })).toThrow('Beleg 1')
    expect(() => validateBackup({ ...ok, adjustments: [{ date: '2026-10-01', minutes: 'x' }] })).toThrow('Buchung 1')
  })
})

describe('backupDue', () => {
  const s = (p: object = {}) => ({ lastBackupAt: undefined, backupSnoozeUntil: undefined, ...p })
  it('nie Erinnerung ohne Daten', () => expect(backupDue({ settings: s(), records: 0, now })).toBe(false))
  it('ohne Sicherung erst ab 5 Einträgen', () => {
    expect(backupDue({ settings: s(), records: 4, now })).toBe(false)
    expect(backupDue({ settings: s(), records: 5, now })).toBe(true)
  })
  it('nach 30 Tagen fällig, vorher nicht', () => {
    expect(backupDue({ settings: s({ lastBackupAt: now - 29 * DAY }), records: 50, now })).toBe(false)
    expect(backupDue({ settings: s({ lastBackupAt: now - 31 * DAY }), records: 50, now })).toBe(true)
  })
  it('„Später" blendet aus, danach wieder fällig', () => {
    expect(backupDue({ settings: s({ backupSnoozeUntil: now + DAY }), records: 50, now })).toBe(false)
    expect(backupDue({ settings: s({ backupSnoozeUntil: now - 1 }), records: 50, now })).toBe(true)
  })
})
