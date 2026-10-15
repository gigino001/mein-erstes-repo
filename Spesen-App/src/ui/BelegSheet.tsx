import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { db, type ReceiptRow } from '../db/db'
import { useObjectUrl } from '../db/hooks'
import { formatAmountInput, parseAmountInput, parseReceipt, vendorKey, type Confidence } from '../domain/receipt'
import { toDateKey } from '../domain/time'
import { CATEGORY_LABEL, type Category } from '../domain/types'
import { prepareImage } from '../ocr/image'
import { recognizeReceipt } from '../ocr/ocr'
import { CategoryDot } from './CategoryDot'
import { Sheet } from './Sheet'

const CATS = Object.keys(CATEGORY_LABEL) as Category[]
type Step = 'pick' | 'work' | 'form'
interface Flags {
  amount?: Confidence
  date?: Confidence
  vendor?: Confidence
  category?: Confidence
}

interface Props {
  /** Vorhandener Beleg zum Bearbeiten. Ohne: neuer Beleg. */
  receipt?: ReceiptRow
  onClose: () => void
  onSaved: (msg: string) => void
}

export function BelegSheet({ receipt, onClose, onSaved }: Props) {
  const rules = useLiveQuery(() => db.merchantRules.toArray())
  const [step, setStep] = useState<Step>(receipt ? 'form' : 'pick')
  const [photo, setPhoto] = useState<Blob | undefined>(receipt?.photo)
  const [ocrText, setOcrText] = useState(receipt?.ocrText)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [notice, setNotice] = useState('')
  const [flags, setFlags] = useState<Flags>({})
  const [amount, setAmount] = useState(receipt ? formatAmountInput(receipt.amount) : '')
  const [date, setDate] = useState(receipt?.date ?? toDateKey(new Date()))
  const [vendor, setVendor] = useState(receipt?.vendor ?? '')
  const [category, setCategory] = useState<Category>(receipt?.category ?? 'sonstiges')
  const [anlass, setAnlass] = useState(receipt?.anlass ?? '')
  const [personen, setPersonen] = useState(receipt?.personen ? String(receipt.personen) : '')
  const [error, setError] = useState('')
  const photoUrl = useObjectUrl(photo)
  const busy = useRef(false)

  const handleFile = async (file: File) => {
    if (busy.current) return
    busy.current = true
    setStep('work')
    setStatus('Bild wird aufbereitet …')
    setProgress(0)
    try {
      const prepared = await prepareImage(file)
      setPhoto(prepared.photo)
      setStatus('Text wird erkannt …')
      let text = ''
      try {
        text = await recognizeReceipt(prepared.ocr, setProgress)
        setOcrText(text)
      } catch (e) {
        console.warn('Texterkennung fehlgeschlagen', e)
        setNotice('Die Texterkennung ist nicht verfügbar. Bitte trage die Werte selbst ein.')
      }
      const map = new Map((rules ?? []).map((r) => [r.merchant, r.category]))
      const p = parseReceipt(text, { today: toDateKey(new Date()), rules: map })
      if (p.amount) setAmount(formatAmountInput(p.amount.value))
      if (p.date) setDate(p.date.value)
      if (p.vendor) setVendor(p.vendor.value)
      setCategory(p.category.value)
      setFlags({ amount: p.amount?.confidence ?? 'low', date: p.date?.confidence ?? 'low', vendor: p.vendor?.confidence ?? 'low', category: p.category.confidence })
      if (text && !notice && !p.amount) setNotice('Der Betrag wurde nicht erkannt. Bitte prüfen.')
      setStep('form')
    } catch (e) {
      console.warn('Bild konnte nicht gelesen werden', e)
      setError('Das Bild konnte nicht gelesen werden. Bitte versuche ein anderes Foto.')
      setStep('pick')
    } finally {
      busy.current = false
    }
  }

  const save = async () => {
    const value = parseAmountInput(amount)
    if (value === null) return setError('Bitte einen Betrag eintragen, z. B. 54,90.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Bitte ein Datum wählen.')
    const row: ReceiptRow = {
      ...(receipt ?? { createdAt: Date.now() }),
      date,
      vendor: vendor.trim(),
      category,
      amount: value,
      anlass: category === 'bewirtung' ? anlass.trim() || undefined : undefined,
      personen: category === 'bewirtung' && Number(personen) > 0 ? Math.round(Number(personen)) : undefined,
      photo,
      ocrText,
    }
    await db.transaction('rw', db.receipts, db.merchantRules, async () => {
      await db.receipts.put(row)
      const key = vendorKey(row.vendor)
      if (key.length >= 3) await db.merchantRules.put({ merchant: key, category })
    })
    onSaved(receipt ? 'Beleg aktualisiert' : 'Beleg gespeichert')
    onClose()
  }

  const hint = (c?: Confidence) => (c && c !== 'high' ? <span className="hint">Bitte prüfen</span> : null)
  const mark = (c?: Confidence) => (c && c !== 'high' ? 'flag' : undefined)

  if (step === 'pick') {
    return (
      <Sheet title="Beleg erfassen" onClose={onClose}>
        <label className="pick" htmlFor="beleg-file">
          <input id="beleg-file" type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])} />
          <svg className="i big-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          <b>Foto aufnehmen oder aus der Galerie wählen</b>
          <span className="note">Der Text wird auf dem Gerät erkannt, nichts wird hochgeladen.</span>
        </label>
        {error && <div className="hint" role="alert">{error}</div>}
        <button className="btn block" onClick={() => setStep('form')}>Ohne Foto eintragen</button>
        <button className="btn ghost block" onClick={onClose}>Abbrechen</button>
      </Sheet>
    )
  }

  if (step === 'work') {
    return (
      <Sheet title="Beleg wird gelesen" onClose={onClose}>
        <div className="scan">
          {photoUrl && <img src={photoUrl} alt="Beleg" />}
          <div className="beam" />
        </div>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${Math.max(4, progress * 100)}%` }} />
        </div>
        <div className="note">{status}</div>
      </Sheet>
    )
  }

  return (
    <Sheet title={receipt ? 'Beleg bearbeiten' : 'Beleg prüfen'} onClose={onClose}>
      {photoUrl && (
        <div className="scan compact">
          <img src={photoUrl} alt="Beleg" />
        </div>
      )}
      {notice && <div className="hint">{notice}</div>}
      <div className="row">
        <div className="field grow">
          <label className="label" htmlFor="bl-amount">Betrag €</label>
          <input id="bl-amount" inputMode="decimal" className={mark(flags.amount)} value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); setFlags((f) => ({ ...f, amount: 'high' })) }} />
          {hint(flags.amount)}
        </div>
        <div className="field grow">
          <label className="label" htmlFor="bl-date">Datum</label>
          <input id="bl-date" type="date" className={mark(flags.date)} value={date} onChange={(e) => { setDate(e.target.value); setFlags((f) => ({ ...f, date: 'high' })) }} />
          {hint(flags.date)}
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="bl-vendor">Händler</label>
        <input id="bl-vendor" className={mark(flags.vendor)} value={vendor} onChange={(e) => { setVendor(e.target.value); setFlags((f) => ({ ...f, vendor: 'high' })) }} />
        {hint(flags.vendor)}
      </div>
      <div>
        <div className="label spaced">Kategorie</div>
        <div className="chips">
          {CATS.map((c) => (
            <button key={c} className="chip with-dot" aria-pressed={category === c} onClick={() => { setCategory(c); setFlags((f) => ({ ...f, category: 'high' })) }}>
              <CategoryDot category={c} />
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        {flags.category && flags.category !== 'high' && <span className="hint">Kategorie wurde geraten. Bitte prüfen.</span>}
      </div>
      {category === 'bewirtung' && (
        <>
          <div className="field">
            <label className="label" htmlFor="bl-anlass">Anlass</label>
            <input id="bl-anlass" placeholder="z. B. Kundentermin Müller GmbH" value={anlass} onChange={(e) => setAnlass(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="bl-personen">Personen</label>
            <input id="bl-personen" inputMode="numeric" placeholder="Anzahl" value={personen} onChange={(e) => setPersonen(e.target.value)} />
          </div>
          {(!anlass.trim() || !personen) && <div className="note">Für Bewirtung brauchst du meist Anlass und Personen.</div>}
        </>
      )}
      {error && <div className="hint" role="alert">{error}</div>}
      <div className="row two">
        <button className="btn primary" onClick={save}>Speichern</button>
        <button className="btn ghost" onClick={onClose}>Abbrechen</button>
      </div>
    </Sheet>
  )
}
