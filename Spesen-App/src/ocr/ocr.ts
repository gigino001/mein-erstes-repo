/** Liest Text aus einem Belegfoto, vollständig offline (Tesseract, Dateien liegen unter /ocr). */
export async function recognizeReceipt(canvas: HTMLCanvasElement, onProgress?: (fraction: number) => void): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('deu', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr',
    langPath: '/ocr/lang',
    workerBlobURL: false,
    cacheMethod: 'none',
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress)
    },
  })
  try {
    const { data } = await worker.recognize(canvas)
    return data.text
  } finally {
    await worker.terminate()
  }
}
