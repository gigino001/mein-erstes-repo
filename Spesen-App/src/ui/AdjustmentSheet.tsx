import { useState } from 'react'
import { addAdjustment } from '../db/actions'
import { parseDuration, toDateKey } from '../domain/time'
import { Sheet } from './Sheet'

export function AdjustmentSheet({ onClose, onSaved }: { onClose: () => void; onSaved: (msg: string) => void }) {
  const [date, setDate] = useState(toDateKey(new Date()))
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const save = async () => {
    const minutes = parseDuration(amount)
    if (minutes === null || minutes === 0) return setError('Bitte Stunden als H:MM mit Vorzeichen eintragen, z. B. -2:00 oder +1:30.')
    if (!date) return setError('Bitte ein Datum wählen.')
    await addAdjustment(date, minutes, note)
    onSaved('Buchung gespeichert')
    onClose()
  }

  return (
    <Sheet title="Manuelle Buchung" onClose={onClose}>
      <div className="note">Für Korrekturen, z. B. eine Auszahlung (Minus) oder Stunden aus dem Vorjahr (Plus).</div>
      <div className="row">
        <div className="field grow">
          <label className="label" htmlFor="adj-date">Datum</label>
          <input id="adj-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field grow">
          <label className="label" htmlFor="adj-amount">Stunden H:MM</label>
          <input id="adj-amount" placeholder="-2:00" value={amount} onChange={(e) => { setAmount(e.target.value); setError('') }} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="adj-note">Notiz</label>
        <input id="adj-note" placeholder="z. B. Auszahlung" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <div className="hint" role="alert">{error}</div>}
      <button className="btn primary block" onClick={save}>Buchen</button>
    </Sheet>
  )
}
