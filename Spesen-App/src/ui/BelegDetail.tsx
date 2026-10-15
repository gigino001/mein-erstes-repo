import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/db'
import { useObjectUrl } from '../db/hooks'
import { formatEuro } from '../domain/time'
import { CATEGORY_LABEL } from '../domain/types'
import { CategoryDot } from './CategoryDot'
import { germanDate } from './format'
import { Sheet } from './Sheet'
import { shareImage } from './share'

export function BelegDetail({ id, onClose, onEdit, onToast }: { id: number; onClose: () => void; onEdit: () => void; onToast: (m: string) => void }) {
  const receipt = useLiveQuery(() => db.receipts.get(id), [id])
  const url = useObjectUrl(receipt?.photo)
  const [confirm, setConfirm] = useState(false)
  if (!receipt) return null

  const save = async () => {
    if (!receipt.photo) return
    const name = `Beleg_${receipt.date}_${(receipt.vendor || 'ohne-haendler').replace(/[^\w-]+/g, '-')}.jpg`
    const r = await shareImage(receipt.photo, name)
    if (r === 'downloaded') onToast('Bild wurde heruntergeladen')
  }
  const remove = async () => {
    await db.receipts.delete(id)
    onToast('Beleg gelöscht')
    onClose()
  }

  return (
    <Sheet title={receipt.vendor || 'Ohne Händler'} onClose={onClose}>
      {url ? (
        <div className="scan"><img src={url} alt="Belegfoto" className="full" /></div>
      ) : (
        <div className="card note">Zu diesem Beleg gibt es kein Foto.</div>
      )}
      <div className="row wrap">
        <span className="tag cat-tag"><CategoryDot category={receipt.category} />{CATEGORY_LABEL[receipt.category]}</span>
        <span className="mono">{germanDate(receipt.date)}</span>
        <b className="mono amount">{formatEuro(receipt.amount)}</b>
      </div>
      {receipt.category === 'bewirtung' && (
        <div className="note">Anlass: {receipt.anlass || '–'} · {receipt.personen ?? '–'} Personen</div>
      )}
      <div className="row two">
        <button className="btn" onClick={onEdit}>Bearbeiten</button>
        <button className="btn" onClick={save} disabled={!receipt.photo}>Bild sichern</button>
      </div>
      {confirm ? (
        <div className="row two">
          <button className="btn danger" onClick={remove}>Wirklich löschen</button>
          <button className="btn ghost" onClick={() => setConfirm(false)}>Abbrechen</button>
        </div>
      ) : (
        <button className="btn ghost danger block" onClick={() => setConfirm(true)}>Löschen</button>
      )}
    </Sheet>
  )
}
