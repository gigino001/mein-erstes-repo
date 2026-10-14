import { createBackup, markBackedUp } from '../backup/backup'
import { shareFiles, type ShareResult } from './share'

/** Erstellt die Sicherung und übergibt sie dem Teilen-Menü (oder Download). Merkt sich den Zeitpunkt, wenn sie weggegeben wurde. */
export async function exportBackupNow(): Promise<ShareResult> {
  const { blob, filename } = await createBackup()
  const result = await shareFiles([new File([blob], filename, { type: 'application/json' })], { title: filename })
  if (result !== 'cancelled') await markBackedUp()
  return result
}
