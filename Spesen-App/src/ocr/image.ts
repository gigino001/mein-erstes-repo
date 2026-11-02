export interface PreparedImage {
  /** Verkleinertes JPEG zum Speichern und Exportieren. */
  photo: Blob
  /** Graustufen mit gestrecktem Kontrast für die Texterkennung. */
  ocr: HTMLCanvasElement
}

const OCR_MAX = 2200
const PHOTO_MAX = 1600

function scaled(w: number, h: number, max: number): [number, number] {
  const k = Math.min(1, max / Math.max(w, h))
  return [Math.round(w * k), Math.round(h * k)]
}

/** Graustufen und Kontrast strecken (2.–98. Perzentil), das hilft bei schwacher Beleuchtung. */
function enhance(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  const hist = new Uint32Array(256)
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(0.299 * d[i]! + 0.587 * d[i + 1]! + 0.114 * d[i + 2]!)
    d[i] = d[i + 1] = d[i + 2] = g
    hist[g]!++
  }
  const total = d.length / 4
  let acc = 0
  let lo = 0
  let hi = 255
  for (let v = 0; v < 256; v++) {
    acc += hist[v]!
    if (acc >= total * 0.02) {
      lo = v
      break
    }
  }
  acc = 0
  for (let v = 255; v >= 0; v--) {
    acc += hist[v]!
    if (acc >= total * 0.02) {
      hi = v
      break
    }
  }
  const range = Math.max(40, hi - lo)
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i]! - lo) * 255) / range))
    d[i] = d[i + 1] = d[i + 2] = v
  }
  ctx.putImageData(img, 0, 0)
}

export async function prepareImage(file: Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const [ow, oh] = scaled(bitmap.width, bitmap.height, OCR_MAX)
    const ocr = document.createElement('canvas')
    ocr.width = ow
    ocr.height = oh
    ocr.getContext('2d')!.drawImage(bitmap, 0, 0, ow, oh)

    const [pw, ph] = scaled(bitmap.width, bitmap.height, PHOTO_MAX)
    const pc = document.createElement('canvas')
    pc.width = pw
    pc.height = ph
    pc.getContext('2d')!.drawImage(ocr, 0, 0, pw, ph)
    const photo = await new Promise<Blob>((resolve, reject) =>
      pc.toBlob((b) => (b ? resolve(b) : reject(new Error('Bild konnte nicht gespeichert werden'))), 'image/jpeg', 0.82),
    )
    enhance(ocr)
    return { photo, ocr }
  } finally {
    bitmap.close()
  }
}
