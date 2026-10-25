// Kopiert die Texterkennung (Worker, Kern, Sprachdaten) nach public/ocr, damit sie offline aus dem eigenen Hosting kommt.
import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const nm = (p) => resolve(root, 'node_modules', p)
const out = resolve(root, 'public/ocr')
mkdirSync(resolve(out, 'lang'), { recursive: true })

const files = [
  [nm('tesseract.js/dist/worker.min.js'), 'worker.min.js'],
  [nm('tesseract.js-core/tesseract-core-lstm.wasm.js'), 'tesseract-core-lstm.wasm.js'],
  [nm('tesseract.js-core/tesseract-core-simd-lstm.wasm.js'), 'tesseract-core-simd-lstm.wasm.js'],
  [nm('tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js'), 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  [nm('@tesseract.js-data/deu/4.0.0_best_int/deu.traineddata.gz'), 'lang/deu.traineddata.gz'],
]
for (const [from, to] of files) {
  if (!existsSync(from)) throw new Error(`OCR-Datei fehlt: ${from}. Bitte "npm install" ausführen.`)
  cpSync(from, resolve(out, to))
}
console.log(`OCR-Dateien nach public/ocr kopiert (${files.length})`)
