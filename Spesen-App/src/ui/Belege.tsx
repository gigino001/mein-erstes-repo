import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db, type ReceiptRow } from '../db/db'
import { useObjectUrl } from '../db/hooks'
import { sumAmounts } from '../domain/receipt'
import { toDateKey, formatEuro } from '../domain/time'
import { CATEGORY_LABEL, type Category } from '../domain/types'
import { CategoryDot } from './CategoryDot'
import { germanDate } from './format'
import { Header } from './Header'

const CATS = Object.keys(CATEGORY_LABEL) as Category[]

export function Thumb({ blob }: { blob?: Blob }) {
  const url = useObjectUrl(blob)
  return url ? <img className="thumb" src={url} alt="" /> : <span className="thumb empty" aria-hidden="true" />
}

export function Belege({ onSettings, onNew, onOpen }: { onSettings: () => void; onNew: () => void; onOpen: (id: number) => void }) {
  const todayKey = toDateKey(new Date())
  const [ym, setYm] = useState(() => ({ y: Number(todayKey.slice(0, 4)), m: Number(todayKey.slice(5, 7)) }))
  const start = `${ym.y}-${String(ym.m).padStart(2, '0')}-01`
  const end = `${ym.y}-${String(ym.m).padStart(2, '0')}-31`
  const rows = useLiveQuery(() => db.receipts.where('date').between(start, end, true, true).toArray(), [start, end])
  const sorted = useMemo(() => (rows ?? []).slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id ?? 0) - (a.id ?? 0))), [rows])
  const sums = useMemo(() => {
    const by = Object.fromEntries(CATS.map((c) => [c, [] as number[]])) as Record<Category, number[]>
    for (const r of sorted) by[r.category].push(r.amount)
    return { by: Object.fromEntries(CATS.map((c) => [c, sumAmounts(by[c])])) as Record<Category, number>, total: sumAmounts(sorted.map((r) => r.amount)) }
  }, [sorted])
  const shift = (n: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m - 1 + n, 1)
      return { y: d.getFullYear(), m: d.getMonth() + 1 }
    })
  const title = new Date(ym.y, ym.m - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <>
      <Header title="Belege" sub={rows ? `${title} · ${sorted.length} ${sorted.length === 1 ? 'Beleg' : 'Belege'} · ${formatEuro(sums.total)}` : title} onSettings={onSettings} />
      <div className="row">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Vorheriger Monat">‹</button>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="Nächster Monat">›</button>
      </div>
      {rows && (<>
      <div className="cats">
        {CATS.map((c) => (
          <div key={c} className="cat">
            <CategoryDot category={c} />
            <span className="n">{CATEGORY_LABEL[c]}</span>
            <b className="mono">{formatEuro(sums.by[c]).replace(/ €/, '')}</b>
          </div>
        ))}
      </div>
      {sorted.length === 0 && <div className="card note">Noch keine Belege in diesem Monat. Mit „Beleg" fotografierst du den ersten.</div>}
      {sorted.length > 0 && (
        <div className="list">
          {sorted.map((r: ReceiptRow) => (
            <button key={r.id} className="rc" onClick={() => onOpen(r.id!)}>
              <Thumb blob={r.photo} />
              <span className="rc-main">
                <span className="vn">{r.vendor || 'Ohne Händler'}</span>
                <span className="mt">
                  <CategoryDot category={r.category} />
                  {CATEGORY_LABEL[r.category]} · {germanDate(r.date).slice(0, 6)}
                </span>
              </span>
              <span className="am mono">{formatEuro(r.amount)}</span>
            </button>
          ))}
        </div>
      )}
      </>)}
      <button className="btn primary fab" onClick={onNew}>
        <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
        Beleg
      </button>
    </>
  )
}
