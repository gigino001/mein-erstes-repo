import type { Report } from '../domain/report'
import { reportFileBase } from '../domain/report'
import { buildPdf } from './pdf'

/** Liest die Belegfotos als Bytes, in der Reihenfolge der Belege. */
export async function photoBytes(r: Report): Promise<(Uint8Array | undefined)[]> {
  return Promise.all(r.receipts.map(async (b) => (b.photo ? new Uint8Array(await b.photo.arrayBuffer()) : undefined)))
}

export async function pdfFile(r: Report): Promise<File> {
  const bytes = await buildPdf(r, await photoBytes(r))
  return new File([bytes as BlobPart], `${reportFileBase(r)}.pdf`, { type: 'application/pdf' })
}

/** Einzelbilder der Belege, benannt wie 'Beleg_2026-10-06_Zum-Loewen.jpg'. */
export function receiptImageFiles(r: Report): File[] {
  return r.receipts.flatMap((b, i) => {
    if (!b.photo) return []
    const who = (b.vendor || 'ohne-haendler').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    return [new File([b.photo], `Beleg_${b.date}_${i + 1}_${who || 'Beleg'}.jpg`, { type: 'image/jpeg' })]
  })
}
