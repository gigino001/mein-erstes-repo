import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useAdjustments, useDays, useSettings } from '../db/hooks'
import { buildReport, reportFileBase } from '../domain/report'
import { formatDuration, formatEuro, toDateKey } from '../domain/time'
import { CATEGORY_LABEL, type Category } from '../domain/types'
import { csvBlob } from '../export/csv'
import { pdfFile, receiptImageFiles } from '../export/files'
import { xlsxBlob } from '../export/xlsx'
import { Header } from './Header'
import { shareFiles } from './share'

const CATS = Object.keys(CATEGORY_LABEL) as Category[]
const tone = (n: number) => (n > 0 ? 'pos' : n < 0 ? 'neg' : '')

export function Abrechnung({ onSettings, onToast }: { onSettings: () => void; onToast: (m: string) => void }) {
  const settings = useSettings()
  const days = useDays()
  const adjustments = useAdjustments()
  const todayKey = toDateKey(new Date())
  const [ym, setYm] = useState(() => ({ y: Number(todayKey.slice(0, 4)), m: Number(todayKey.slice(5, 7)) }))
  const [busy, setBusy] = useState('')
  const start = `${ym.y}-${String(ym.m).padStart(2, '0')}-01`
  const end = `${ym.y}-${String(ym.m).padStart(2, '0')}-31`
  const rows = useLiveQuery(() => db.receipts.where('date').between(start, end, true, true).toArray(), [start, end])
  const report = useMemo(
    () => (rows ? buildReport({ year: ym.y, month: ym.m, entries: days, receipts: rows, adjustments, settings, today: todayKey }) : null),
    [rows, ym, days, adjustments, settings, todayKey],
  )
  const shift = (n: number) =>
    setYm(({ y, m }) => {
      const d = new Date(y, m - 1 + n, 1)
      return { y: d.getFullYear(), m: d.getMonth() + 1 }
    })

  const run = async (label: string, job: () => Promise<void>) => {
    if (busy) return
    setBusy(label)
    try {
      await job()
    } catch (e) {
      console.error(e)
      onToast('Das hat nicht geklappt. Bitte versuche es noch einmal.')
    } finally {
      setBusy('')
    }
  }
  const done = (res: string, what: string) => {
    if (res === 'downloaded') onToast(`${what} wurde heruntergeladen`)
  }
  if (!report) return <Header title="Abrechnung" sub="" onSettings={onSettings} />
  const r = report

  const sharePdf = () => run('PDF', async () => done(await shareFiles([await pdfFile(r)], { title: `Spesenabrechnung ${r.title}` }), 'Das PDF'))
  const shareExcel = () =>
    run('Excel', async () => {
      const f = new File([await xlsxBlob(r)], `${reportFileBase(r)}.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      done(await shareFiles([f], { title: `Spesenabrechnung ${r.title}` }), 'Die Excel-Datei')
    })
  const shareCsv = () =>
    run('CSV', async () => {
      const f = new File([csvBlob(r)], `${reportFileBase(r)}.csv`, { type: 'text/csv' })
      done(await shareFiles([f], { title: `Spesenabrechnung ${r.title}` }), 'Die CSV-Datei')
    })
  const shareImages = () =>
    run('Bilder', async () => {
      const files = receiptImageFiles(r)
      done(await shareFiles(files, { title: `Belege ${r.title}` }), `${files.length} Bilder`)
    })
  const mail = () =>
    run('Mail', async () => {
      const subject = settings.mailSubject
      const body = `Hallo,\n\nanbei meine Spesenabrechnung für ${r.title}.\n\nViele Grüße\n${settings.name}`
      const res = await shareFiles([await pdfFile(r)], { title: subject, text: body })
      if (res === 'downloaded') {
        onToast('PDF heruntergeladen. Bitte in der Mail anhängen.')
        window.location.href = `mailto:${encodeURIComponent(settings.mailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      }
    })
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      onToast(`${what} kopiert`)
    } catch {
      onToast(text)
    }
  }
  const photos = r.receipts.filter((b) => b.photo).length
  const usedCats = CATS.filter((c) => r.byCategory[c] > 0)

  return (
    <>
      <Header title="Abrechnung" sub={`${r.title} · ${formatEuro(r.total)}`} onSettings={onSettings} />
      <div className="row">
        <button className="icon-btn" onClick={() => shift(-1)} aria-label="Vorheriger Monat">‹</button>
        <button className="icon-btn" onClick={() => shift(1)} aria-label="Nächster Monat">›</button>
      </div>

      {r.warnings.length > 0 && (
        <section className="card warn-card" aria-label="Hinweise">
          <div className="label">Vor dem Senden prüfen</div>
          <ul className="plan">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </section>
      )}

      <article className="sheetdoc">
        <div>
          <div className="label">Spesenabrechnung</div>
          <h2 className="doc-name">{r.name}</h2>
          <div className="note">{r.title}</div>
        </div>
        <div className="blk">
          <div className="label">Arbeitszeit</div>
          <div className="kv"><span>Soll</span><i /><b className="mono">{formatDuration(r.soll)}</b></div>
          <div className="kv"><span>Ist</span><i /><b className="mono">{formatDuration(r.ist)}</b></div>
          <div className="kv"><span>Differenz</span><i /><b className={`mono ${tone(r.diff)}`}>{formatDuration(r.diff, true)}</b></div>
        </div>
        <div className="blk">
          <div className="label">Verpflegung</div>
          <div className="kv"><span>{r.verpDays} {r.verpDays === 1 ? 'Tag' : 'Tage'} × {formatEuro(r.verpRate)}</span><i /><b className="mono">{formatEuro(r.verp)}</b></div>
        </div>
        <div className="blk">
          <div className="label">Belege</div>
          {usedCats.length === 0 && <div className="note">Keine Belege in diesem Monat.</div>}
          {usedCats.map((c) => <div key={c} className="kv"><span>{CATEGORY_LABEL[c]}</span><i /><b className="mono">{formatEuro(r.byCategory[c])}</b></div>)}
          {usedCats.length > 0 && <div className="kv"><span>Summe Belege</span><i /><b className="mono">{formatEuro(r.receiptTotal)}</b></div>}
        </div>
        <div className="kv tot"><span>Gesamt Auszahlung</span><i /><b className="mono">{formatEuro(r.total)}</b></div>
        {r.konto && (
          <div className="blk">
            <div className="label">Stundenkonto</div>
            <div className="kv"><span>Vormonat</span><i /><b className="mono">{formatDuration(r.konto.previous, true)}</b></div>
            <div className="kv"><span>Dieser Monat</span><i /><b className={`mono ${tone(r.konto.change)}`}>{formatDuration(r.konto.change, true)}</b></div>
            <div className="kv"><span>Stand</span><i /><b className="mono">{formatDuration(r.konto.end, true)}</b></div>
          </div>
        )}
        <details>
          <summary>Tagesübersicht (Seite 2 im PDF)</summary>
          <div className="mini-wrap">
            <table className="mini">
              <tbody>
                {r.days.filter((d) => d.booked).map((d) => (
                  <tr key={d.date}>
                    <td>{d.date.slice(8)}.{d.date.slice(5, 7)}.</td>
                    <td>{d.label}</td>
                    <td>{d.start && d.end ? `${d.start}–${d.end}` : ''}</td>
                    <td>{d.verp ? formatEuro(d.verp).replace(',00', '') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </article>
      <div className="note">{photos > 0 ? `Ab Seite 3: Beleg-Übersicht und ${photos} ${photos === 1 ? 'Belegfoto' : 'Belegfotos'}.` : 'Das PDF enthält Zusammenfassung und Tagesübersicht.'}</div>

      <div className="exports">
        <button className="btn primary" onClick={sharePdf} disabled={!!busy}>{busy === 'PDF' ? 'Erstelle …' : 'PDF teilen'}</button>
        <button className="btn" onClick={mail} disabled={!!busy}>{busy === 'Mail' ? 'Erstelle …' : 'Per Mail'}</button>
        <button className="btn" onClick={shareExcel} disabled={!!busy}>{busy === 'Excel' ? 'Erstelle …' : 'Excel'}</button>
        <button className="btn" onClick={shareCsv} disabled={!!busy}>{busy === 'CSV' ? 'Erstelle …' : 'CSV'}</button>
        <button className="btn span2" onClick={shareImages} disabled={!!busy || photos === 0}>{busy === 'Bilder' ? 'Bereite vor …' : `Belegbilder sichern (${photos})`}</button>
      </div>

      <section className="card mailbox">
        <div className="label">Mail</div>
        <div className="mail-row">
          <span className="note">Betreff</span>
          <span className="mono grow">{settings.mailSubject}</span>
          <button className="btn slim" onClick={() => copy(settings.mailSubject, 'Betreff')}>Kopieren</button>
        </div>
        <div className="mail-row">
          <span className="note">An</span>
          <span className="mono grow">{settings.mailTo || 'nicht eingestellt'}</span>
          {settings.mailTo ? <button className="btn slim" onClick={() => copy(settings.mailTo, 'Adresse')}>Kopieren</button> : <button className="btn slim" onClick={onSettings}>Eintragen</button>}
        </div>
        <div className="note">„Per Mail" öffnet das Teilen-Menü mit dem PDF im Anhang. Dort wählst du Mail. Empfänger und Betreff trägst du dort ein, Anhänge kann eine Web-App nicht selbst in die Mail-App setzen.</div>
      </section>
    </>
  )
}
