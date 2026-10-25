import { useMemo, useState } from "react";
import { ConfirmButton, Chip, Dots, FileButton, PageHead, Photo, Section, Sheet, cx } from "../components/ui";
import { wearStats } from "../lib/logic";
import { SEASONS, STYLES, type Item } from "../lib/types";
import { eur, list, shortCat } from "../lib/util";
import { useApp } from "../state/AppContext";

export function WardrobePage() {
  const app = useApp(); const { items, busy, wear, usable } = app;
  const [cat, setCat] = useState("Alle"); const [q, setQ] = useState(""); const [season, setSeason] = useState(""); const [style, setStyle] = useState(""); const [color, setColor] = useState("");
  const [archived, setArchived] = useState(false); const [stats, setStats] = useState(false); const [open, setOpen] = useState<string | null>(null);
  const colors = useMemo(() => [...new Set(items.map((i) => i.color).filter(Boolean))].sort(), [items]);
  const cats = ["Alle", ...app.allCats().filter((c) => items.some((i) => i.category === c))];
  const needle = q.trim().toLowerCase();
  const shown = items.filter((i) => (archived ? i.archived : !i.archived) && (cat === "Alle" || i.category === cat) && (!season || i.seasons.includes(season)) && (!style || i.styles.includes(style)) && (!color || i.color === color)
    && (!needle || [i.name, i.category, i.color, i.material, i.brand, i.notes, i.occasions.join(" ")].join(" ").toLowerCase().includes(needle)));
  const up = busy.upload && !busy.upload.kind ? busy.upload : null; const recutN = items.filter((i) => !i.cutId && !i.cutTried && i.imageId && i.status !== "pending").length;
  const rc = busy.recut; const unrec = items.filter((i) => i.status === "manual" && !i.archived).length;
  const openItem = items.find((i) => i.id === open) ?? null;
  return (
    <>
      <PageHead eyebrow={`${usable.length} Teile`} title="Kleiderschrank" />
      <FileButton multiple label="+ Teile fotografieren oder hochladen" busy={up && `Analysiere ${up.done + 1} von ${up.total} …`} onFiles={app.uploadItems} />
      <p className="mt-3 text-xs text-muted">Tipp: ein Teil pro Foto, flach hingelegt oder auf dem Bügel vor ruhigem Hintergrund.</p>
      {(recutN > 0 || rc) && <div className="note mt-4 flex items-center justify-between gap-4 text-sm"><p>{rc ? `Stelle frei: ${rc.done} von ${rc.total} …` : `${recutN} ${recutN === 1 ? "Teil hat" : "Teile haben"} noch den Hintergrund. Jetzt freistellen?`}</p><button className="btn btn-sm btn-ghost shrink-0" disabled={!!rc} onClick={app.recutAll}>Freistellen</button></div>}

      {(unrec > 0 || busy.reall) && <div className="note mt-4 flex items-center justify-between gap-4 text-sm"><p>{busy.reall ? `Erkenne: ${busy.reall.done} von ${busy.reall.total} …` : `${unrec} ${unrec === 1 ? "Teil wurde" : "Teile wurden"} noch nicht erkannt (KI kurz nicht erreichbar).`}</p><button className="btn btn-sm btn-ghost shrink-0" disabled={!!busy.reall || !app.aiReady} onClick={app.reanalyzeMissing}>Erneut erkennen</button></div>}

      <section className="mt-8 space-y-4">
        <input type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suchen: Farbe, Material, Marke …" aria-label="Kleiderschrank durchsuchen" />
        <div className="scrollx">{cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c === "Alle" ? c : shortCat(c)}</Chip>)}</div>
        <div className="grid grid-cols-3 gap-4">
          <select className="input" aria-label="Jahreszeit" value={season} onChange={(e) => setSeason(e.target.value)}><option value="">Saison</option>{SEASONS.map((s) => <option key={s}>{s}</option>)}</select>
          <select className="input" aria-label="Stil" value={style} onChange={(e) => setStyle(e.target.value)}><option value="">Stil</option>{STYLES.map((s) => <option key={s.k}>{s.k}</option>)}</select>
          <select className="input" aria-label="Farbe" value={color} onChange={(e) => setColor(e.target.value)}><option value="">Farbe</option>{colors.map((c) => <option key={c}>{c}</option>)}</select>
        </div>
        <div className="flex gap-2"><Chip on={stats} onClick={() => setStats(!stats)}>Statistik</Chip><Chip on={archived} onClick={() => setArchived(!archived)}>Archiv anzeigen</Chip></div>
      </section>
      {stats && <Stats items={usable} wear={wear} onOpen={setOpen} />}

      <section className="mt-8">
        {shown.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {shown.map((i) => (
              <button key={i.id} onClick={() => setOpen(i.id)} className={cx("group text-left", i.archived && "opacity-50")}>
                <Photo id={i.imageId} pending={i.status === "pending"} className="aspect-[4/5] transition-transform duration-500 group-hover:scale-[1.01]" />
                <p className="mt-3 truncate text-sm font-semibold">{i.status === "pending" ? "Wird erkannt …" : i.name || "Ohne Namen"}</p>
                <p className="eyebrow !text-[.6rem] mt-0.5">{shortCat(i.category)} · F{i.formality}{i.uncertain.length ? " · prüfen" : ""}</p>
              </button>
            ))}
          </div>
        ) : <p className="py-16 text-center text-muted">{items.length ? "Keine Teile für diese Filter." : "Noch leer. Fang mit deinen Lieblingsteilen an: ein Hemd, eine Hose, ein Paar Schuhe."}</p>}
      </section>
      <ItemSheet item={openItem} onClose={() => setOpen(null)} />
    </>
  );
}

function Stats({ items, wear, onOpen }: { items: Item[]; wear: ReturnType<typeof useApp>["wear"]; onOpen: (id: string) => void }) {
  const ws = wearStats(wear); const val = items.reduce((s, i) => s + (Number(i.price) || 0), 0);
  const worn = items.filter((i) => ws[i.id]).sort((a, b) => ws[b.id].n - ws[a.id].n); const never = items.filter((i) => !ws[i.id]);
  const cpw = items.filter((i) => Number(i.price) > 0 && ws[i.id]).map((i) => ({ i, c: Number(i.price) / ws[i.id].n })).sort((a, b) => b.c - a.c);
  const Row = ({ i, v }: { i: Item; v: string }) => <button className="flex w-full items-center gap-4 border-b border-line py-2 text-left" onClick={() => onOpen(i.id)}><Photo id={i.imageId} className="h-12 w-12 shrink-0" /><b className="flex-1 truncate text-sm">{i.name}</b><span className="font-display text-lg">{v}</span></button>;
  return (
    <Section className="card !mt-6 space-y-6 p-5">
      <div className="grid grid-cols-3 text-center">{[[String(items.length), "Teile"], [val ? eur(val) : "–", "Wert laut Preisen"], [`${items.length ? Math.round((worn.length / items.length) * 100) : 0} %`, "schon getragen"]].map(([a, b]) => <div key={b}><b className="font-display text-3xl font-medium">{a}</b><p className="eyebrow mt-1 !text-[.58rem]">{b}</p></div>)}</div>
      {worn.length ? <div><p className="eyebrow mb-1">Am häufigsten getragen</p>{worn.slice(0, 5).map((i) => <Row key={i.id} i={i} v={`${ws[i.id].n}×`} />)}</div> : <p className="text-sm text-muted">Tippe bei einem Outfit auf „Heute getragen“. Dann siehst du hier, was du wirklich trägst.</p>}
      {never.length > 0 && worn.length > 0 && <div><p className="eyebrow mb-2">Noch nie getragen ({never.length})</p><div className="scrollx">{never.slice(0, 12).map((i) => <button key={i.id} className="w-20 shrink-0" onClick={() => onOpen(i.id)} aria-label={i.name}><Photo id={i.imageId} className="aspect-[4/5]" /></button>)}</div><p className="mt-2 text-xs text-muted">Frag auf der Startseite gezielt nach einem Outfit mit einem dieser Teile.</p></div>}
      {cpw.length > 0 && <div><p className="eyebrow mb-1">Kosten pro Tragen (teuerste zuerst)</p>{cpw.slice(0, 5).map(({ i, c }) => <Row key={i.id} i={i} v={eur(c)} />)}</div>}
      <p className="text-xs text-muted">Zählt nur, was du als getragen markierst.</p>
    </Section>
  );
}

function ItemSheet({ item, onClose }: { item: Item | null; onClose: () => void }) {
  return <Sheet open={!!item} onClose={onClose} label={item?.name || "Teil"}>{item && <ItemForm key={item.id} item={item} onClose={onClose} />}</Sheet>;
}
function ItemForm({ item: i, onClose }: { item: Item; onClose: () => void }) {
  const app = useApp(); const { busy, outfits, wear } = app; const [f, setF] = useState({ ...i, price: i.price ?? "", brand: i.brand ?? "", notes: i.notes ?? "" });
  const [tol, setTol] = useState(1); const [newCat, setNewCat] = useState(""); const [occ, setOcc] = useState(list(i.occasions).join(", "));
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const u = new Set(i.uncertain); const ub = (k: string) => u.has(k) && <span className="ml-2 normal-case tracking-normal text-gold">unsicher – bitte prüfen</span>;
  const w = wearStats(wear)[i.id];
  const partners = useMemo(() => { const m = new Map<string, number>(); outfits.filter((o) => (o.fav || o.rating === 1) && o.itemIds.includes(i.id)).forEach((o) => o.itemIds.forEach((x) => x !== i.id && m.set(x, (m.get(x) ?? 0) + 1))); return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([x]) => app.items.find((it) => it.id === x)).filter(Boolean) as Item[]; }, [outfits, i.id]); // eslint-disable-line
  const cut = busy["cut-" + i.id]; const cats = app.allCats();
  const save = async () => {
    const category = f.category === "__new" ? newCat.trim() : f.category; if (!category) { app.toast("Gib der neuen Kategorie einen Namen."); return; }
    const ok = await app.saveItem(i.id, { name: f.name.trim() || "Kleidungsstück", category, color: f.color.trim(), pattern: f.pattern.trim(), material: f.material.trim(), fit: f.fit.trim(), details: f.details.trim(), styles: f.styles, seasons: f.seasons, formality: f.formality, weather: f.weather.trim(), occasions: list(occ), brand: f.brand.trim(), price: String(f.price), notes: f.notes.trim() }, f.category === "__new" ? category : undefined);
    if (ok) onClose();
  };
  return (
    <div className="space-y-6">
      <Photo id={i.imageId} alt={i.name} className="aspect-square" />
      {i.status === "pending" && <p className="text-muted">Wird gerade erkannt …</p>}
      <p className="eyebrow">{w ? `Getragen ${w.n}× · zuletzt ${new Date(w.last).toLocaleDateString("de-DE")}${Number(i.price) > 0 ? " · " + eur(Number(i.price) / w.n) + " pro Tragen" : ""}` : "Noch nicht als getragen markiert"}</p>
      <div className="field"><span>Hintergrund</span>
        {i.cutId && i.origId ? <div className="flex gap-2"><Chip on={i.imageId === i.cutId} onClick={() => app.saveItemImage(i, "cut")}>Freigestellt</Chip><Chip on={i.imageId === i.origId} onClick={() => app.saveItemImage(i, "orig")}>Original</Chip></div>
          : <p className="text-sm text-muted">{i.origId ? "Automatisch nicht sauber erkennbar. Tipp: einfarbiger Untergrund, der sich klar vom Teil abhebt." : "Dieses Teil wurde noch nicht freigestellt."}</p>}
        <div className="flex items-center gap-3"><label className="flex-1 text-xs text-muted">Fein<input type="range" min="0.6" max="1.8" step="0.2" value={tol} onChange={(e) => setTol(Number(e.target.value))} className="w-full accent-[var(--gold)]" />Grob</label><button className="btn btn-sm btn-ghost" disabled={cut || !i.imageId} onClick={() => app.recut(i, tol)}>{cut ? "Stelle frei …" : "Neu freistellen"}</button></div></div>
      <label className="field"><span>Bezeichnung{ub("name")}</span><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label className="field"><span>Kategorie{ub("category")}</span><select className="input" value={f.category} onChange={(e) => set("category", e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}<option value="__new">+ Eigene Kategorie …</option></select></label>
      {f.category === "__new" && <input className="input" placeholder="Name der neuen Kategorie" value={newCat} onChange={(e) => setNewCat(e.target.value)} autoFocus />}
      <div className="grid grid-cols-2 gap-6"><label className="field"><span>Farbe{ub("color")}</span><input className="input" value={f.color} onChange={(e) => set("color", e.target.value)} /></label><label className="field"><span>Muster{ub("pattern")}</span><input className="input" value={f.pattern} onChange={(e) => set("pattern", e.target.value)} /></label></div>
      <div className="grid grid-cols-2 gap-6"><label className="field"><span>Material{ub("material")}</span><input className="input" value={f.material} onChange={(e) => set("material", e.target.value)} /></label><label className="field"><span>Passform{ub("fit")}</span><input className="input" value={f.fit} onChange={(e) => set("fit", e.target.value)} /></label></div>
      <label className="field"><span>Details{ub("details")}</span><input className="input" value={f.details} onChange={(e) => set("details", e.target.value)} /></label>
      <div className="field"><span>Stil{ub("styles")}</span><div className="flex flex-wrap gap-2">{STYLES.map((s) => <Chip key={s.k} on={f.styles.includes(s.k)} onClick={() => set("styles", f.styles.includes(s.k) ? f.styles.filter((x) => x !== s.k) : [...f.styles, s.k])}>{s.k}</Chip>)}</div></div>
      <div className="field"><span>Jahreszeiten{ub("seasons")}</span><div className="flex flex-wrap gap-2">{SEASONS.map((s) => <Chip key={s} on={f.seasons.includes(s)} onClick={() => set("seasons", f.seasons.includes(s) ? f.seasons.filter((x) => x !== s) : [...f.seasons, s])}>{s}</Chip>)}</div></div>
      <label className="field"><span>Formalität: {f.formality} von 5{ub("formality")}</span><input type="range" min="1" max="5" step="1" value={f.formality} onChange={(e) => set("formality", Number(e.target.value))} className="accent-[var(--gold)]" /><Dots n={f.formality} /></label>
      <label className="field"><span>Wetter</span><input className="input" value={f.weather} onChange={(e) => set("weather", e.target.value)} /></label>
      <label className="field"><span>Anlässe (mit Komma)</span><input className="input" value={occ} onChange={(e) => setOcc(e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-6"><label className="field"><span>Marke</span><input className="input" value={f.brand} onChange={(e) => set("brand", e.target.value)} /></label><label className="field"><span>Kaufpreis (€)</span><input type="number" inputMode="decimal" className="input" value={f.price} onChange={(e) => set("price", e.target.value)} /></label></div>
      <label className="field"><span>Notizen</span><textarea className="input" value={f.notes} onChange={(e) => set("notes", e.target.value)} /></label>
      {partners.length > 0 && <div className="field"><span>Gut kombiniert mit</span><div className="scrollx">{partners.map((p) => <Photo key={p.id} id={p.imageId} alt={p.name} className="h-20 w-16 shrink-0" />)}</div></div>}
      <button className="btn w-full" onClick={save}>Speichern</button>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-sm btn-ghost" onClick={() => { void app.archiveItem(i); onClose(); }}>{i.archived ? "Wiederherstellen" : "Archivieren"}</button>
        {app.aiReady && <button className="btn btn-sm btn-ghost" disabled={busy["re-" + i.id]} onClick={() => app.reanalyze(i)}>{busy["re-" + i.id] ? "Erkenne …" : "Neu erkennen"}</button>}
        <ConfirmButton label="Löschen" sure="Endgültig löschen?" onConfirm={() => { void app.deleteItem(i); onClose(); }} />
        <button className="btn btn-sm btn-ghost ml-auto" onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
}
