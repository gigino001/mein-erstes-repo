import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { LookCard, OutfitVisual } from "../components/outfit";
import { Chip, ConfirmButton, Dots, Field, PageHead, Photo, Section, Sheet } from "../components/ui";
import type { Outfit, Trip } from "../lib/types";
import { useApp } from "../state/AppContext";

export function OutfitsPage() {
  const app = useApp(); const { outfits, trips } = app; const loc = useLocation();
  const init = loc.state as { filter?: string; open?: string } | null;
  const [filter, setFilter] = useState(init?.filter ?? "alle"); const [cmp, setCmp] = useState<string[] | null>(null);
  const [open, setOpen] = useState<string | null>(init?.open ?? null); const [compareOpen, setCompareOpen] = useState(false);
  const [tripNew, setTripNew] = useState(false); const [trip, setTrip] = useState<string | null>(null);
  useEffect(() => { window.history.replaceState({}, ""); }, []);
  const all = outfits.filter((o) => !o.replaced || o.fav);
  const shown = all.filter((o) => filter === "alle" || (filter === "fav" && o.fav) || (filter === "rated" && o.rating));
  const tripsOK = app.usable.length >= 4 && app.aiReady;
  const cur = outfits.find((o) => o.id === open) ?? null; const curTrip = trips.find((t) => t.id === trip) ?? null;
  return (
    <>
      <PageHead eyebrow={`${outfits.length} gespeichert`} title="Outfits" />
      <Section title="Reisen" className="!mt-0" action={<button className="btn btn-sm btn-ghost" disabled={!tripsOK} onClick={() => setTripNew(true)}>+ Koffer packen</button>}>
        {trips.length ? <div className="space-y-2">{trips.map((t) => { const pk = t.itemIds.filter((x) => t.packed[x]).length; return (
          <button key={t.id} onClick={() => setTrip(t.id)} className="flex w-full items-center gap-4 border-b border-line py-3 text-left"><Thumbs ids={t.itemIds} /><div><b>{t.title}</b><p className="text-xs text-muted">{t.days} Tage · {pk} von {t.itemIds.length} eingepackt</p></div></button>); })}</div>
          : <p className="text-sm text-muted">Sag mir Ziel, Dauer und Pläne. Ich packe eine kombinierbare Kapsel aus deinem Schrank, mit einem Outfit für jeden Tag.</p>}
      </Section>
      <Section title="Vorschläge" action={shown.length >= 2 && <Chip on={!!cmp} onClick={() => setCmp(cmp ? null : [])}>{cmp ? "Fertig" : "Vergleichen"}</Chip>}>
        <div className="mb-5 flex gap-2">{[["alle", "Alle"], ["fav", "Favoriten"], ["rated", "Bewertet"]].map(([k, l]) => <Chip key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Chip>)}</div>
        {cmp && <div className="note mb-4 flex items-center justify-between text-sm"><span>Tippe 2 bis 3 Looks an · {cmp.length} von 3</span><button className="btn btn-sm" disabled={cmp.length < 2} onClick={() => setCompareOpen(true)}>Vergleichen</button></div>}
        {shown.length ? <div className="space-y-1">{shown.map((o) => {
          const sel = cmp?.includes(o.id);
          return <button key={o.id} aria-pressed={cmp ? !!sel : undefined} onClick={() => cmp ? setCmp(sel ? cmp.filter((x) => x !== o.id) : cmp.length < 3 ? [...cmp, o.id] : (app.toast("Höchstens drei Looks gleichzeitig."), cmp)) : setOpen(o.id)}
            className={`flex w-full items-center gap-4 border-b border-line py-3 text-left ${sel ? "bg-gold/10" : ""}`}><Thumbs ids={o.itemIds} />
            <div className="min-w-0"><b className="block truncate">{o.fav && "♥ "}{o.label}</b><span className="block truncate text-xs text-muted">{o.request || "—"} · {new Date(o.createdAt).toLocaleDateString("de-DE")}{o.rating === 1 ? " · gefällt" : o.rating === -1 ? " · abgelehnt" : ""}</span></div></button>; })}</div>
          : <p className="py-12 text-center text-muted">{filter === "fav" ? "Noch keine Favoriten." : "Noch keine gespeicherten Outfits. Sie erscheinen hier, sobald du einen Vorschlag speicherst, bewertest oder trägst."}</p>}
      </Section>

      <Sheet open={!!cur} onClose={() => setOpen(null)} label="Outfit">{cur && <div className="space-y-4"><LookCard outfit={cur} /><p className="text-sm text-muted">Anlass: {cur.request || "—"}</p><button className="btn btn-ghost w-full" onClick={() => setOpen(null)}>Schließen</button></div>}</Sheet>
      <Sheet open={compareOpen} onClose={() => setCompareOpen(false)} label="Vergleich"><Compare ids={cmp ?? []} onClose={() => setCompareOpen(false)} /></Sheet>
      <Sheet open={tripNew} onClose={() => setTripNew(false)} label="Koffer packen">{tripNew && <TripForm onDone={(t) => { setTripNew(false); if (t) setTrip(t.id); }} />}</Sheet>
      <Sheet open={!!curTrip} onClose={() => setTrip(null)} label="Reise">{curTrip && <TripView trip={curTrip} onClose={() => setTrip(null)} />}</Sheet>
    </>
  );
}

const Thumbs = ({ ids }: { ids: string[] }) => { const { items } = useApp(); return <div className="flex shrink-0 -space-x-3">{ids.slice(0, 3).map((id) => <Photo key={id} id={items.find((i) => i.id === id)?.imageId} className="h-14 w-12 border border-paper" />)}</div>; };

function Compare({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const app = useApp(); const os = ids.map((id) => app.outfits.find((o) => o.id === id)).filter(Boolean) as Outfit[];
  return (
    <div className="space-y-4"><h2>Vergleich</h2>
      <div className="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2">{os.map((o) => (
        <div key={o.id} className="w-64 shrink-0 snap-start space-y-3"><h3>{o.label}</h3><OutfitVisual outfit={o} onOpen={() => {}} noToggle />
          <p className="eyebrow">Formalität <Dots n={o.formality} /></p>{o.effect && <p className="text-sm">{o.effect}</p>}
          <ul className="list-disc pl-4 text-xs text-muted">{o.itemIds.map((id) => app.items.find((i) => i.id === id)).filter(Boolean).map((i) => <li key={i!.id}>{i!.name}</li>)}</ul>
          <div className="flex flex-wrap gap-2"><Chip on={o.fav} onClick={() => app.toggleFav(o)}>{o.fav ? "♥" : "♡"}</Chip><Chip on={o.rating === 1} onClick={() => app.setRating(o, 1)}>Gefällt mir</Chip><Chip on={o.rating === -1} onClick={() => app.setRating(o, -1)}>Nein</Chip></div></div>))}</div>
      <p className="text-xs text-muted">Seitlich wischen. Die Flatlay-Ansicht ordnet deine freigestellten Fotos an und zeigt keine echte Passform am Körper.</p>
      <button className="btn btn-ghost w-full" onClick={onClose}>Schließen</button></div>
  );
}

function TripForm({ onDone }: { onDone: (t: Trip | null) => void }) {
  const app = useApp(); const [dest, setDest] = useState(""); const [days, setDays] = useState(3); const [bag, setBag] = useState("Handgepäck"); const [wx, setWx] = useState(""); const [plans, setPlans] = useState(""); const [busy, setBusy] = useState(false);
  const go = async () => { if (!dest.trim()) { app.toast("Wohin geht die Reise?"); return; } setBusy(true); const t = await app.createTrip({ dest: dest.trim(), days: Math.max(1, Math.min(21, days || 3)), wx: wx.trim(), plans: plans.trim(), bag }); setBusy(false); if (t) onDone(t); };
  return (
    <div className="space-y-6"><div><p className="eyebrow mb-2">Koffer packen</p><h2>Wohin geht’s?</h2></div>
      <Field label="Ziel"><input className="input" value={dest} onChange={(e) => setDest(e.target.value)} placeholder="z. B. Mailand oder Geschäftsreise Hamburg" autoFocus /></Field>
      <div className="grid grid-cols-2 gap-6"><Field label="Tage"><input type="number" min={1} max={21} className="input" value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field><Field label="Gepäck"><select className="input" value={bag} onChange={(e) => setBag(e.target.value)}><option>Handgepäck</option><option>Koffer</option></select></Field></div>
      <Field label="Erwartetes Wetter"><input className="input" value={wx} onChange={(e) => setWx(e.target.value)} placeholder="Leer lassen = ich schätze" /></Field>
      <Field label="Was steht an?"><textarea className="input" value={plans} onChange={(e) => setPlans(e.target.value)} placeholder="z. B. Tagsüber Stadt und Museen, ein schickes Abendessen, ein Strandtag" /></Field>
      <button className="btn w-full" disabled={busy} onClick={go}>{busy ? "Packe deinen Koffer …" : "Koffer packen"}</button><button className="btn btn-ghost w-full" onClick={() => onDone(null)}>Abbrechen</button></div>
  );
}
function TripView({ trip: t, onClose }: { trip: Trip; onClose: () => void }) {
  const app = useApp(); const done = t.itemIds.filter((x) => t.packed[x]).length;
  return (
    <div className="space-y-6"><div><p className="eyebrow mb-2">{t.days} Tage · {t.bag}</p><h2>{t.title}</h2></div>
      <div className="field"><span>Packliste · {done} von {t.itemIds.length} eingepackt</span><div>{t.itemIds.map((x) => { const i = app.items.find((it) => it.id === x); return i ? (
        <button key={x} aria-pressed={!!t.packed[x]} onClick={() => app.packTrip(t, x)} className="flex w-full items-center gap-4 border-b border-line py-2 text-left"><Photo id={i.imageId} className="h-12 w-10 shrink-0" /><span className={`flex-1 text-sm ${t.packed[x] ? "line-through opacity-50" : ""}`}>{i.name}</span><i className="grid h-5 w-5 place-items-center border border-ink text-xs not-italic" aria-hidden>{t.packed[x] ? "✓" : ""}</i></button>) : null; })}</div></div>
      <div className="field"><span>Outfit pro Tag</span><div className="space-y-4">{t.plan.map((d) => <div key={d.label}><b className="text-sm">{d.label}</b><div className="mt-2 flex gap-1">{d.itemIds.map((x) => <Photo key={x} id={app.items.find((i) => i.id === x)?.imageId} className="h-16 w-14" />)}</div>{d.note && <p className="mt-1 text-xs text-muted">{d.note}</p>}</div>)}</div></div>
      {t.tips && <p className="note text-sm">{t.tips}</p>}
      {t.missing.length > 0 && <div className="note text-sm"><p className="eyebrow mb-1">Würde noch fehlen</p><p>{t.missing.join(" · ")}</p><p className="mt-1 text-muted">Hast du nicht im Schrank. Der Koffer oben funktioniert ohne.</p></div>}
      <div className="flex gap-2"><ConfirmButton label="Löschen" sure="Reise endgültig löschen?" onConfirm={() => { void app.deleteTrip(t); onClose(); }} /><button className="btn btn-sm btn-ghost ml-auto" onClick={onClose}>Schließen</button></div></div>
  );
}
