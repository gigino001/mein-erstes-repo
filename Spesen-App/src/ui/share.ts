export type ShareResult = 'shared' | 'downloaded' | 'cancelled'

function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/**
 * Öffnet das Teilen-Menü mit den Dateien (dort Mail, „Bild sichern", Dateien …).
 * Ohne Teilen-Menü (z. B. am Desktop) werden die Dateien heruntergeladen.
 */
export async function shareFiles(files: File[], opts: { title?: string; text?: string } = {}): Promise<ShareResult> {
  if (navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title: opts.title, text: opts.text })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    }
  }
  files.forEach((f, i) => setTimeout(() => download(f), i * 250))
  return 'downloaded'
}

export const shareImage = (blob: Blob, filename: string) => shareFiles([new File([blob], filename, { type: blob.type || 'image/jpeg' })], { title: filename })
