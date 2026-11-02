import { useEffect, useState } from 'react'
import { parseBackup, restoreBackup, summarize, type BackupFile } from '../backup/backup'
import type { Settings } from '../domain/types'
import { exportBackupNow } from './backupActions'
import { germanDate } from './format'

function ageText(at: number | undefined): string {
  if (!at) return 'Noch keine Sicherung.'
  const days = Math.floor((Date.now() - at) / 86400000)
  return days <= 0 ? 'Letzte Sicherung: heute.' : `Letzte Sicherung: vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}.`
}

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

export function BackupSection({ settings, onToast, onClose }: { settings: Settings; onToast: (m: string) => void; onClose: () => void }) {
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [pending, setPending] = useState<BackupFile | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted, () => setPersisted(null))
  }, [])

  const exportNow = async () => {
    if (busy) return
    setBusy(true)
    try {
      const r = await exportBackupNow()
      if (r === 'downloaded') onToast('Backup wurde heruntergeladen')
      else if (r === 'shared') onToast('Backup gesichert')
    } catch (e) {
      console.error(e)
      setError('Das Backup konnte nicht erstellt werden.')
    } finally {
      setBusy(false)
    }
  }

  const pick = async (file: File) => {
    setError('')
    try {
      setPending(parseBackup(await file.text()))
    } catch (e) {
      setPending(null)
      setError(e instanceof Error ? e.message : 'Die Datei konnte nicht gelesen werden.')
    }
  }

  const restore = async () => {
    if (!pending) return
    try {
      await restoreBackup(pending)
      onToast('Sicherung wiederhergestellt')
      onClose()
    } catch (e) {
      console.error(e)
      setPending(null)
      setError('Die Wiederherstellung hat nicht geklappt. Deine bisherigen Daten sind unverändert.')
    }
  }

  const sum = pending ? summarize(pending) : null
  return (
    <section className="blk data-block" aria-label="Daten">
      <div className="label">Daten</div>
      <div className="note">{ageText(settings.lastBackupAt)}</div>
      {persisted === false && <div className="hint">Der Browser könnte die Daten bei Platzmangel löschen. Sichere regelmäßig.</div>}
      {!standalone() && <div className="note">Tipp: Füge die App zum Home-Bildschirm hinzu. Dann löscht iOS die Daten nicht nach Wochen ohne Nutzung.</div>}
      {!pending && (
        <div className="row two">
          <button className="btn" onClick={exportNow} disabled={busy}>{busy ? 'Sichere …' : 'Backup erstellen'}</button>
          <label className="btn file-btn">
            Wiederherstellen
            <input type="file" accept="application/json,.json" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void pick(f) }} />
          </label>
        </div>
      )}
      {sum && (
        <div className="card warn-card">
          <b>Sicherung{sum.exportedAt ? ` vom ${germanDate(sum.exportedAt.slice(0, 10))}` : ''}</b>
          <div className="note">
            {sum.days} {sum.days === 1 ? 'Tag' : 'Tage'}, {sum.receipts} {sum.receipts === 1 ? 'Beleg' : 'Belege'} ({sum.photos} mit Foto), {sum.adjustments} {sum.adjustments === 1 ? 'Buchung' : 'Buchungen'}. Alle aktuellen Daten auf diesem Gerät werden ersetzt.
          </div>
          <div className="row two spaced-top">
            <button className="btn danger" onClick={restore}>Ersetzen</button>
            <button className="btn ghost" onClick={() => setPending(null)}>Abbrechen</button>
          </div>
        </div>
      )}
      {error && <div className="hint" role="alert">{error}</div>}
    </section>
  )
}
