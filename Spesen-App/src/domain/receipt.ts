import { fromDateKey, toDateKey } from './time'
import type { Category } from './types'

export type Confidence = 'high' | 'medium' | 'low'
export interface Found<T> {
  value: T
  confidence: Confidence
}
export interface ParsedReceipt {
  amount?: Found<number>
  /** 'YYYY-MM-DD' */
  date?: Found<string>
  vendor?: Found<string>
  category: Found<Category>
}

/** Schlüssel für Händlerregeln: klein, ohne Umlaute und Sonderzeichen. */
export function vendorKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

/** Betrag aus einem Eingabefeld: '54,90', '54.90', '1.234,56', '54,90 €'. */
export function parseAmountInput(text: string): number | null {
  const t = text.replace(/[€\s]|EUR/gi, '')
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(t)) return null
  const normalized = /,/.test(t) ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

/** Betrag für ein Eingabefeld: 54.9 → '54,90'. */
export function formatAmountInput(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

/** Summiert Beträge ohne Rundungsfehler. */
export function sumAmounts(values: readonly number[]): number {
  return values.reduce((s, v) => s + Math.round(v * 100), 0) / 100
}

/** Korrigiert typische OCR-Verwechslungen in Zahlen (O→0, l/I→1 zwischen Ziffern). */
function fixDigits(line: string): string {
  return line
    .replace(/(?<=\d)[Oo](?=[\d.,\-/]|\s|$)|(?<=[.,\-/])[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[lI|](?=[\d.,\-/])|(?<=[.,\-/])[lI|](?=\d)/g, '1')
}

const AMOUNT_RE = /(?<![\d.,])(\d{1,3}(?:\.\d{3})+|\d+)[.,](\d{2})(?!\d)/g
const STRONG = /\b(summe|gesamt(?:betrag|summe|preis)?|total|zu\s*zahlen|zahlbetrag|endbetrag|rechnungsbetrag|brutto|saldo)\b/i
const WEAK = /\b(bar|ec|ec-?karte|girocard|karte|kartenzahlung|visa|mastercard|maestro|kreditkarte|betrag|zahlung|bezahlt)\b/i
const IGNORE = /\b(mwst|mw\.?\s?st|ust|steuer|netto|r[uü]ckgeld|zur[uü]ck|gegeben|rabatt|pfand|trinkgeld|tip)\b|%/i

function amountsIn(line: string): number[] {
  const out: number[] = []
  // Datumsangaben (13.10.2026, 13.10.26) sind keine Beträge.
  const withoutDates = line.replace(/(?<!\d)\d{1,2}[./-]\d{1,2}[./-](?:\d{4}|\d{2})(?!\d)/g, ' ').replace(/(?<!\d)\d{4}-\d{2}-\d{2}(?!\d)/g, ' ')
  for (const m of withoutDates.matchAll(AMOUNT_RE)) {
    const v = Number(`${m[1]!.replace(/\./g, '')}.${m[2]}`)
    if (v > 0 && v < 10000) out.push(v)
  }
  return out
}

function findAmount(lines: string[]): Found<number> | undefined {
  const strong = new Map<number, number>()
  const weak = new Map<number, number>()
  const all: number[] = []
  const bump = (map: Map<number, number>, v: number) => map.set(v, (map.get(v) ?? 0) + 1)
  for (const line of lines) {
    const values = amountsIn(line)
    if (!values.length) continue
    const last = values[values.length - 1]!
    if (IGNORE.test(line) && !STRONG.test(line)) continue
    all.push(...values)
    if (STRONG.test(line)) bump(strong, last)
    else if (WEAK.test(line)) bump(weak, last)
  }
  const keys = new Set([...strong.keys(), ...weak.keys()])
  if (keys.size) {
    let best = 0
    let bestScore = -1
    for (const v of keys) {
      const score = 3 * (strong.get(v) ?? 0) + 1.5 * (weak.get(v) ?? 0)
      if (score > bestScore || (score === bestScore && v > best)) {
        best = v
        bestScore = score
      }
    }
    const confirmed = (strong.get(best) ?? 0) > 0 && (strong.get(best) ?? 0) + (weak.get(best) ?? 0) >= 2
    return { value: best, confidence: confirmed ? 'high' : 'medium' }
  }
  if (!all.length) return undefined
  return { value: Math.max(...all), confidence: 'low' }
}

const DATE_RE = /(?<!\d)(\d{1,2})[./-](\d{1,2})[./-](\d{4}|\d{2})(?!\d)/g
const ISO_RE = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g

function validDate(y: number, m: number, d: number, today: string): string | undefined {
  const dt = new Date(y, m - 1, d, 12)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return undefined
  const key = toDateKey(dt)
  const limit = toDateKey(new Date(fromDateKey(today).getTime() + 36 * 3600 * 1000))
  const oldest = `${Number(today.slice(0, 4)) - 3}${today.slice(4)}`
  return key <= limit && key >= oldest ? key : undefined
}

function findDate(text: string, today: string): Found<string> | undefined {
  const found: string[] = []
  for (const m of text.matchAll(ISO_RE)) {
    const k = validDate(Number(m[1]), Number(m[2]), Number(m[3]), today)
    if (k) found.push(k)
  }
  for (const m of text.matchAll(DATE_RE)) {
    const yr = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3])
    const k = validDate(yr, Number(m[2]), Number(m[1]), today)
    if (k) found.push(k)
  }
  if (!found.length) return undefined
  const distinct = new Set(found)
  return { value: found[0]!, confidence: distinct.size === 1 ? 'high' : 'medium' }
}

interface Brand {
  re: RegExp
  name: string
  cat: Category
}
const BRANDS: Brand[] = [
  { re: /\baral\b/i, name: 'Aral', cat: 'sprit' },
  { re: /\bshell\b/i, name: 'Shell', cat: 'sprit' },
  { re: /\besso\b/i, name: 'Esso', cat: 'sprit' },
  { re: /\bbp\b/i, name: 'BP', cat: 'sprit' },
  { re: /total\s?energies/i, name: 'TotalEnergies', cat: 'sprit' },
  { re: /\bjet\b/i, name: 'JET', cat: 'sprit' },
  { re: /\bavia\b/i, name: 'AVIA', cat: 'sprit' },
  { re: /\bagip\b/i, name: 'Agip', cat: 'sprit' },
  { re: /\bomv\b/i, name: 'OMV', cat: 'sprit' },
  { re: /\bhem\b/i, name: 'HEM', cat: 'sprit' },
  { re: /\bionity\b/i, name: 'Ionity', cat: 'sprit' },
  { re: /\benbw\b/i, name: 'EnBW', cat: 'sprit' },
  { re: /\bapcoa\b/i, name: 'APCOA', cat: 'parken' },
  { re: /q-?\s?park/i, name: 'Q-Park', cat: 'parken' },
  { re: /\bcontipark\b/i, name: 'Contipark', cat: 'parken' },
  { re: /\bibis\b/i, name: 'ibis', cat: 'hotel' },
  { re: /\bnovotel\b/i, name: 'Novotel', cat: 'hotel' },
  { re: /\bmercure\b/i, name: 'Mercure', cat: 'hotel' },
  { re: /holiday\s?inn/i, name: 'Holiday Inn', cat: 'hotel' },
  { re: /motel\s?one/i, name: 'Motel One', cat: 'hotel' },
  { re: /premier\s?inn/i, name: 'Premier Inn', cat: 'hotel' },
  { re: /mc\s?donald/i, name: "McDonald's", cat: 'bewirtung' },
  { re: /burger\s?king/i, name: 'Burger King', cat: 'bewirtung' },
  { re: /\bkfc\b/i, name: 'KFC', cat: 'bewirtung' },
  { re: /\bstarbucks\b/i, name: 'Starbucks', cat: 'bewirtung' },
  { re: /\bvapiano\b/i, name: 'Vapiano', cat: 'bewirtung' },
  { re: /\bhornbach\b/i, name: 'Hornbach', cat: 'material' },
  { re: /\bbauhaus\b/i, name: 'Bauhaus', cat: 'material' },
  { re: /\bobi\b/i, name: 'OBI', cat: 'material' },
  { re: /\btoom\b/i, name: 'toom', cat: 'material' },
  { re: /\bhagebau/i, name: 'hagebau', cat: 'material' },
  { re: /w[uü]rth/i, name: 'Würth', cat: 'material' },
  { re: /\bconrad\b/i, name: 'Conrad', cat: 'material' },
  { re: /\bstaples\b/i, name: 'Staples', cat: 'material' },
  { re: /\brewe\b/i, name: 'REWE', cat: 'sonstiges' },
  { re: /\bedeka\b/i, name: 'EDEKA', cat: 'sonstiges' },
  { re: /\baldi\b/i, name: 'ALDI', cat: 'sonstiges' },
  { re: /\blidl\b/i, name: 'Lidl', cat: 'sonstiges' },
  { re: /\bkaufland\b/i, name: 'Kaufland', cat: 'sonstiges' },
]

const KEYWORDS: Record<Exclude<Category, 'sonstiges'>, RegExp[]> = {
  sprit: [/tankstelle/i, /\b(diesel|benzin|kraftstoff|super\s?e?\d*|e10|e5|ultimate|v-?power)\b/i, /\bzapfs[aä]ule|s[aä]ule\b/i, /\bliter\b|\bl\s?x\s?\d/i, /\bkwh\b|ladestrom|ladevorgang|ladesaeule|lades[aä]ule/i],
  parken: [/park(haus|schein|ticket|geb[uü]hr|platz|en)|parking|tiefgarage|parkdauer/i, /einfahrt|ausfahrt/i],
  hotel: [/\bhotel\b|\bmotel\b|pension|hostel|\bb&b\b/i, /[uü]bernachtung|zimmer|logis|beherbergung|city\s?tax|bettensteuer/i, /fr[uü]hst[uü]ck/i],
  bewirtung: [/restaurant|gastst[aä]tte|bistro|pizzeria|trattoria|imbiss|caf[eé]\b|brauhaus|gasthaus/i, /speisen|getr[aä]nke|bewirtung|tisch\s?\d*|bedienung/i, /\b(cola|wasser|bier|wein|kaffee|pizza|schnitzel)\b/i],
  material: [/baumarkt|werkzeug|schrauben|b[uü]robedarf|elektro(markt|zubeh)/i, /\b(kabel|dübel|duebel|schraube|farbe|akku)\b/i],
}

function findCategory(text: string, vendor: Found<string> | undefined, rules?: ReadonlyMap<string, Category>): Found<Category> {
  if (rules?.size) {
    const key = vendor ? vendorKey(vendor.value) : ''
    const hit = (key && rules.get(key)) || [...rules].find(([k]) => k.length >= 4 && vendorKey(text.slice(0, 300)).includes(k))?.[1]
    if (hit) return { value: hit, confidence: 'high' }
  }
  const score = new Map<Category, number>()
  const add = (c: Category, n: number) => score.set(c, (score.get(c) ?? 0) + n)
  for (const b of BRANDS) if (b.re.test(text)) add(b.cat, 3)
  for (const [cat, regs] of Object.entries(KEYWORDS) as [Category, RegExp[]][]) for (const r of regs) if (r.test(text)) add(cat, 1)
  const order: Category[] = ['sprit', 'parken', 'hotel', 'bewirtung', 'material', 'sonstiges']
  let best: Category = 'sonstiges'
  let bestScore = 0
  for (const c of order) {
    const s = score.get(c) ?? 0
    if (s > bestScore) {
      best = c
      bestScore = s
    }
  }
  return { value: best, confidence: bestScore >= 3 ? 'high' : bestScore >= 1 ? 'medium' : 'low' }
}

const SKIP_LINE = /^(kassenbon|kundenbeleg|beleg|rechnung|quittung|datum|tel|telefon|fax|www|http|ust|steuer|kasse|bon|vielen dank|danke)\b/i

function findVendor(text: string, lines: string[]): Found<string> | undefined {
  for (const b of BRANDS) if (b.re.test(text)) return { value: b.name, confidence: 'high' }
  for (const raw of lines.slice(0, 8)) {
    const line = raw.replace(/[^\p{L}\p{N} &.'\-]/gu, ' ').replace(/\s+/g, ' ').trim()
    if (line.length < 3 || line.length > 40) continue
    if (SKIP_LINE.test(line) || /@|\d{5}|str(\.|a[sß]e)\b|\bweg\b|\bplatz\b/i.test(line)) continue
    const letters = (line.match(/\p{L}/gu) ?? []).length
    if (letters / line.length < 0.6 || letters < 3) continue
    return { value: line, confidence: 'medium' }
  }
  return undefined
}

/** Wertet erkannten Belegtext aus. `rules` sind gelernte Zuordnungen Händler → Kategorie. */
export function parseReceipt(text: string, opts: { today: string; rules?: ReadonlyMap<string, Category> }): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const fixed = lines.map(fixDigits)
  const vendor = findVendor(text, lines)
  return {
    amount: findAmount(fixed),
    date: findDate(fixed.join('\n'), opts.today),
    vendor,
    category: findCategory(text, vendor, opts.rules),
  }
}
