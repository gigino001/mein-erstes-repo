import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { formatDuration } from '../domain/time'
import { CATEGORY_LABEL, type Category } from '../domain/types'
import type { Report } from '../domain/report'

const W = 595.28
const H = 841.89
const M = 48
const INK = rgb(0.06, 0.11, 0.1)
const MUTED = rgb(0.36, 0.42, 0.4)
const LINE = rgb(0.83, 0.86, 0.84)
const ACCENT = rgb(0.12, 0.25, 0.82)
const RED = rgb(0.69, 0.2, 0.29)
const GREEN = rgb(0.11, 0.48, 0.29)

const eur = (n: number) => `${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`
const dateDe = (key: string) => `${key.slice(8)}.${key.slice(5, 7)}.${key.slice(0, 4)}`
const dur = (m: number, sign = false) => formatDuration(m, sign).replace('−', '-')

type Align = 'left' | 'right'

class Writer {
  doc!: PDFDocument
  regular!: PDFFont
  bold!: PDFFont
  page!: PDFPage
  y = 0
  private sets = new Map<PDFFont, Set<number>>()

  static async create(): Promise<Writer> {
    const w = new Writer()
    w.doc = await PDFDocument.create()
    w.regular = await w.doc.embedFont(StandardFonts.Helvetica)
    w.bold = await w.doc.embedFont(StandardFonts.HelveticaBold)
    for (const f of [w.regular, w.bold]) w.sets.set(f, new Set(f.getCharacterSet()))
    return w
  }

  /** Ersetzt Zeichen, die die Standardschrift nicht kennt. */
  safe(font: PDFFont, text: string): string {
    const set = this.sets.get(font)!
    let out = ''
    for (const ch of text.replace(/−/g, '-').replace(/ /g, ' ').replace(/[\r\n\t]+/g, ' ')) out += set.has(ch.codePointAt(0)!) ? ch : '?'
    return out
  }

  newPage(header?: string): PDFPage {
    this.page = this.doc.addPage([W, H])
    this.y = H - M
    if (header) {
      this.text(header, M, this.y, { size: 9, color: MUTED })
      this.y -= 22
    }
    return this.page
  }

  width(text: string, size: number, font = this.regular): number {
    return font.widthOfTextAtSize(this.safe(font, text), size)
  }

  /** Kürzt Text mit „…", bis er in `max` passt. */
  fit(text: string, size: number, max: number, font = this.regular): string {
    let t = this.safe(font, text)
    if (font.widthOfTextAtSize(t, size) <= max) return t
    while (t.length > 1 && font.widthOfTextAtSize(t + '...', size) > max) t = t.slice(0, -1)
    return t + '...'
  }

  text(text: string, x: number, y: number, o: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; align?: Align } = {}) {
    const font = o.font ?? this.regular
    const size = o.size ?? 10
    const t = this.safe(font, text)
    const px = o.align === 'right' ? x - font.widthOfTextAtSize(t, size) : x
    this.page.drawText(t, { x: px, y, size, font, color: o.color ?? INK })
  }

  rule(y: number, x1 = M, x2 = W - M, color = LINE, thickness = 0.7) {
    this.page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color })
  }

  /** Zeile Label ........ Wert */
  kv(label: string, value: string, o: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}) {
    const font = o.bold ? this.bold : this.regular
    this.text(label, M, this.y, { font, size: 11 })
    this.text(value, W - M, this.y, { font, size: 11, align: 'right', color: o.color })
    this.y -= 18
  }

  heading(label: string) {
    this.y -= 8
    this.text(label.toUpperCase(), M, this.y, { size: 8.5, font: this.bold, color: MUTED })
    this.y -= 6
    this.rule(this.y)
    this.y -= 16
  }

  table(cols: { title: string; x: number; align?: Align; w: number }[], rows: { cells: string[]; color?: ReturnType<typeof rgb> }[], header: string) {
    const drawHead = () => {
      for (const c of cols) this.text(c.title, c.align === 'right' ? c.x + c.w : c.x, this.y, { size: 8.5, font: this.bold, color: MUTED, align: c.align })
      this.y -= 6
      this.rule(this.y, M, W - M, INK, 0.8)
      this.y -= 14
    }
    drawHead()
    for (const row of rows) {
      if (this.y < M + 30) {
        this.newPage(header)
        drawHead()
      }
      cols.forEach((c, i) => {
        const raw = row.cells[i] ?? ''
        this.text(this.fit(raw, 9.5, c.w), c.align === 'right' ? c.x + c.w : c.x, this.y, { size: 9.5, align: c.align, color: row.color })
      })
      this.y -= 4
      this.rule(this.y)
      this.y -= 13
    }
  }
}

const CAT_ORDER = Object.keys(CATEGORY_LABEL) as Category[]

/** Baut die Monatsabrechnung als PDF. `photos[i]` gehört zu `report.receipts[i]` (JPEG-Bytes). */
export async function buildPdf(r: Report, photos: (Uint8Array | undefined)[] = []): Promise<Uint8Array> {
  const w = await Writer.create()
  const header = `Spesenabrechnung · ${r.name} · ${r.title}`

  // Seite 1: Zusammenfassung
  w.newPage()
  w.text('Spesenabrechnung', M, w.y - 16, { size: 24, font: w.bold })
  w.y -= 42
  w.text(r.name, M, w.y, { size: 13 })
  w.text(r.title, W - M, w.y, { size: 13, align: 'right', color: ACCENT, font: w.bold })
  w.y -= 14

  w.heading('Arbeitszeit')
  w.kv('Soll', dur(r.soll))
  w.kv('Ist', dur(r.ist))
  w.kv('Differenz', dur(r.diff, true), { bold: true, color: r.diff < 0 ? RED : r.diff > 0 ? GREEN : INK })

  w.heading('Verpflegung')
  w.kv(`${r.verpDays} ${r.verpDays === 1 ? 'Tag' : 'Tage'} × ${eur(r.verpRate)}`, eur(r.verp))

  w.heading('Belege')
  const used = CAT_ORDER.filter((c) => r.byCategory[c] > 0)
  if (!used.length) w.kv('Keine Belege', eur(0))
  for (const c of used) w.kv(CATEGORY_LABEL[c], eur(r.byCategory[c]))
  if (used.length) w.kv('Summe Belege', eur(r.receiptTotal), { bold: true })

  w.y -= 6
  w.rule(w.y + 12, M, W - M, INK, 1.2)
  w.y -= 4
  w.text('Gesamt Auszahlung', M, w.y, { size: 14, font: w.bold })
  w.text(eur(r.total), W - M, w.y, { size: 14, font: w.bold, align: 'right' })
  w.y -= 22

  if (r.konto) {
    w.heading('Stundenkonto')
    w.kv('Vormonat', dur(r.konto.previous, true))
    w.kv('Dieser Monat', dur(r.konto.change, true))
    w.kv('Stand', dur(r.konto.end, true), { bold: true })
  }
  if (r.warnings.length) {
    w.y -= 6
    for (const t of r.warnings) {
      w.text(`Hinweis: ${t}`, M, w.y, { size: 9, color: RED })
      w.y -= 13
    }
  }

  // Tagesübersicht
  w.newPage(header)
  w.text('Tagesübersicht', M, w.y, { size: 15, font: w.bold })
  w.y -= 24
  const cw = W - 2 * M
  w.table(
    [
      { title: 'Datum', x: M, w: 60 },
      { title: 'Art', x: M + 66, w: 96 },
      { title: 'Beginn', x: M + 168, w: 48, align: 'right' },
      { title: 'Ende', x: M + 222, w: 48, align: 'right' },
      { title: 'Ist', x: M + 282, w: 50, align: 'right' },
      { title: 'Differenz', x: M + 338, w: 66, align: 'right' },
      { title: 'Verpflegung', x: M + 410, w: cw - 410, align: 'right' },
    ],
    r.days.map((d) => ({
      cells: [
        `${['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(Number(d.date.slice(0, 4)), Number(d.date.slice(5, 7)) - 1, Number(d.date.slice(8))).getDay()]} ${d.date.slice(8)}.${d.date.slice(5, 7)}.`,
        d.label || (d.missing ? 'fehlt' : '-'),
        d.start ?? '',
        d.end ?? '',
        d.booked ? dur(d.ist) : '',
        d.booked ? dur(d.diff, true) : '',
        d.verp ? eur(d.verp) : '',
      ],
      color: d.missing ? RED : undefined,
    })),
    header,
  )
  w.y -= 2
  w.kv('Summe', `${dur(r.ist)} · ${dur(r.diff, true)} · ${eur(r.verp)}`, { bold: true })

  // Belegübersicht
  if (r.receipts.length) {
    w.newPage(header)
    w.text('Belege', M, w.y, { size: 15, font: w.bold })
    w.y -= 24
    w.table(
      [
        { title: 'Nr', x: M, w: 20 },
        { title: 'Datum', x: M + 28, w: 62 },
        { title: 'Händler', x: M + 96, w: 150 },
        { title: 'Kategorie', x: M + 252, w: 82 },
        { title: 'Anlass', x: M + 340, w: 95 },
        { title: 'Betrag', x: M + 440, w: cw - 440, align: 'right' },
      ],
      r.receipts.map((b, i) => ({
        cells: [String(i + 1), dateDe(b.date), b.vendor || '-', CATEGORY_LABEL[b.category], b.category === 'bewirtung' ? `${b.anlass || '-'}${b.personen ? ` (${b.personen} P.)` : ''}` : '', eur(b.amount)],
      })),
      header,
    )
    w.y -= 2
    w.kv('Summe Belege', eur(r.receiptTotal), { bold: true })

    // Belegfotos, zwei pro Seite
    const gap = 20
    const cell = (cw - gap) / 2
    for (let i = 0; i < r.receipts.length; i += 2) {
      w.newPage(header)
      for (let k = 0; k < 2; k++) {
        const idx = i + k
        const b = r.receipts[idx]
        if (!b) break
        const x = M + k * (cell + gap)
        const top = w.y
        w.text(`Beleg ${idx + 1}`, x, top, { size: 11, font: w.bold })
        w.text(w.fit(`${dateDe(b.date)} · ${b.vendor || 'ohne Händler'}`, 9.5, cell), x, top - 14, { size: 9.5 })
        w.text(w.fit(`${CATEGORY_LABEL[b.category]} · ${eur(b.amount)}`, 9.5, cell), x, top - 27, { size: 9.5, color: MUTED })
        let imgTop = top - 40
        if (b.category === 'bewirtung' && (b.anlass || b.personen)) {
          w.text(w.fit(`Anlass: ${b.anlass || '-'}${b.personen ? ` · ${b.personen} Personen` : ''}`, 9, cell), x, top - 40, { size: 9, color: MUTED })
          imgTop -= 13
        }
        const bytes = photos[idx]
        if (!bytes) {
          w.text('Kein Foto vorhanden', x, imgTop - 14, { size: 9.5, color: MUTED })
          continue
        }
        try {
          const img = await w.doc.embedJpg(bytes)
          const maxH = imgTop - M - 10
          const k2 = Math.min(cell / img.width, maxH / img.height, 1.6)
          const iw = img.width * k2
          const ih = img.height * k2
          w.page.drawRectangle({ x, y: imgTop - ih - 6, width: iw, height: ih + 6, borderColor: LINE, borderWidth: 0.7 })
          w.page.drawImage(img, { x: x + 0, y: imgTop - ih - 3, width: iw, height: ih })
        } catch {
          w.text('Foto konnte nicht eingebettet werden', x, imgTop - 14, { size: 9.5, color: RED })
        }
      }
    }
  }

  // Fußzeile mit Seitenzahl
  const pages = w.doc.getPages()
  pages.forEach((p, i) => {
    const t = `Seite ${i + 1} von ${pages.length}`
    p.drawText(t, { x: W - M - w.regular.widthOfTextAtSize(t, 8), y: 24, size: 8, font: w.regular, color: MUTED })
    p.drawText('Spesen App', { x: M, y: 24, size: 8, font: w.regular, color: MUTED })
  })
  w.doc.setTitle(`Spesenabrechnung ${r.name} ${r.title}`)
  w.doc.setAuthor(r.name)
  w.doc.setCreator('Spesen App')
  return w.doc.save()
}
