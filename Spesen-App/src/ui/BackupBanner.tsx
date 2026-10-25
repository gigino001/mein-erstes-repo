import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { backupDue } from '../backup/backup'
import { db, updateSettings } from '../db/db'
import { useDays, useSettings } from '../db/hooks'
import { exportBackupNow } from './backupActions'

/** Erinnert an die Sicherung: nach 30 Tagen, oder wenn es noch keine gibt und schon Daten da sind. */
export function BackupBanner({ onToast }: { onToast: (m: string) => void }) {
  const settings = useSettings()
  const days = useDays()
  const receipts = useLiveQuery(() => db.receipts.count(), [], 0)
  const [busy, setBusy] = useState(false)
  if (!backupDue({ settings, records: days.size + receipts, now: Date.now() })) return null

  const age = settings.lastBackupAt ? Math.floor((Date.now() - settings.lastBackupAt) / 86400000) : null
  const now = async () => {
    setBusy(true)
    try {
      const r = await exportBackupNow()
      if (r === 'downloaded') onToast('Backup wurde heruntergeladen')
      else if (r === 'shared') onToast('Backup gesichert')
    } catch {
      onToast('Das Backup konnte nicht erstellt werden.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="card warn-card" aria-label="Erinnerung">
      <b>{age === null ? 'Noch keine Sicherung' : `Letzte Sicherung vor ${age} Tagen`}</b>
      <div className="note">Deine Daten liegen nur auf diesem Gerät. Eine Sicherung schützt sie vor Verlust.</div>
      <div className="row two spaced-top">
        <button className="btn primary" onClick={now} disabled={busy}>{busy ? 'Sichere …' : 'Jetzt sichern'}</button>
        <button className="btn ghost" onClick={() => updateSettings({ backupSnoozeUntil: Date.now() + 7 * 86400000 })}>Später</button>
      </div>
    </section>
  )
}
