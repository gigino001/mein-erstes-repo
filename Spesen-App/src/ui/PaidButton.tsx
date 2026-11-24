import { setReceiptPaid } from '../db/actions'

/**
 * Roter Knopf: noch nicht ausgezahlt. Nach dem Antippen grün mit Häkchen: schon ausgezahlt.
 * Ein weiteres Antippen macht es wieder rückgängig.
 */
export function PaidButton({ id, paid, vendor }: { id: number; paid: boolean; vendor: string }) {
  const name = vendor || 'Beleg'
  return (
    <button
      className={`paid-btn${paid ? ' on' : ''}`}
      aria-pressed={paid}
      aria-label={paid ? `${name}: bezahlt. Antippen, um es wieder auf offen zu setzen` : `${name}: noch nicht bezahlt. Antippen, wenn es ausgezahlt wurde`}
      onClick={() => void setReceiptPaid(id, !paid)}
    >
      {paid ? (
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      ) : (
        <span aria-hidden="true">€</span>
      )}
    </button>
  )
}
