import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LookCard } from "../components/outfit";
import { Chip, PageHead, Photo, Section } from "../components/ui";
import { STYLES, WEATHER_CONDITIONS } from "../lib/types";
import { toggle } from "../lib/util";
import { fetchWeather } from "../lib/weather";
import { useApp } from "../state/AppContext";

export function HomePage() {
  const app = useApp(); const { profile, usable, wx, results, busy, outfits } = app; const nav = useNavigate(); const loc = useLocation();
  const [req, setReq] = useState(""); const [styles, setStyles] = useState<string[]>([]); const [answer, setAnswer] = useState(""); const [locating, setLocating] = useState(false);
  // Vom Inspirationsbild oder aus einem alten Outfit hierher gesprungen
  useEffect(() => {
    const s = loc.state as { req?: string; inspiration?: string } | null; if (!s) return;
    nav(".", { replace: true, state: null });
    if (s.req) setReq(s.req);
    if (s.inspiration) void app.generate({ text: s.req ?? "", styles: [], inspiration: s.inspiration, label: s.req });
  }, []); // eslint-disable-line
  const n = usable.length; const canGen = aiOK(app) && n >= 2 && !busy.gen;
  const favs = outfits.filter((o) => o.fav).slice(0, 10);
  const today = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });

  const locate = async () => {
    setLocating(true);
    try { app.setWx(await fetchWeather()); } catch { app.toast("Standort nicht verfügbar. Trag das Wetter einfach selbst ein."); } finally { setLocating(false); }
  };
  return (
    <>
      <PageHead eyebrow={today} title={`Hallo ${profile!.name}.`} lede="Was steht heute an? Ich helfe dir, das passende Outfit zu finden." />
      <div className="space-y-6 border-t border-ink pt-6">
        <textarea className="input !min-h-28 font-display text-lg italic" aria-label="Anlass und Wünsche" value={req} onChange={(e) => setReq(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(hover:hover)").matches && canGen) { e.preventDefault(); void app.generate({ text: req, styles }); } }}
          placeholder="z. B. Heute Abend gehobenes Italienisch mit meiner Freundin, 14 Grad und trocken." />
        <div className="space-y-3">
          <div className="flex items-center justify-between"><p className="eyebrow">Wetter heute</p><button className="text-xs font-semibold underline underline-offset-4" onClick={locate} disabled={locating}>{locating ? "Suche …" : "Per Standort"}</button></div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-baseline gap-1 border-b border-line"><input type="number" inputMode="numeric" aria-label="Temperatur in Grad Celsius" className="w-12 bg-transparent py-1 text-center text-lg outline-none" value={wx.temp} placeholder="–" onChange={(e) => app.setWx({ ...wx, temp: e.target.value })} /><i className="text-sm not-italic text-muted">°C</i></span>
            {WEATHER_CONDITIONS.map((c) => <Chip key={c} on={wx.cond.includes(c)} onClick={() => app.setWx({ ...wx, cond: toggle(wx.cond.filter((x) => !(c === "Sonnig" && x === "Bewölkt") && !(c === "Bewölkt" && x === "Sonnig")), c) })}>{c}</Chip>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{STYLES.map((s) => <Chip key={s.k} on={styles.includes(s.k)} onClick={() => setStyles(toggle(styles, s.k))}>{s.k}</Chip>)}</div>
        <button className="btn w-full" disabled={!canGen} onClick={() => app.generate({ text: req, styles })}>{busy.gen ? "Stelle Outfits zusammen …" : "Outfits zusammenstellen"}</button>
        {!app.aiReady && <p className="note text-sm">Die KI ist noch nicht eingerichtet. <Link to="/profil" className="font-semibold underline">Schlüssel hinterlegen</Link></p>}
        {n < 3 && <div className="note text-sm"><b>Dein Schrank ist noch fast leer.</b> Fotografiere mindestens Oberteile, Hosen und Schuhe, dann kann ich echte Outfits bauen. <Link to="/schrank" className="font-semibold underline">Zum Kleiderschrank</Link></div>}
      </div>

      <section aria-live="polite" className="mt-10 space-y-6">
        {busy.gen && <div className="space-y-6">{[0, 1].map((i) => <div key={i} className="card space-y-3 p-5"><div className="skel h-5 w-1/3" /><div className="skel aspect-[4/5]" /><div className="skel h-4" /><div className="skel h-4 w-2/3" /></div>)}<p className="text-center text-sm text-muted">Ich gehe deinen Schrank durch …</p></div>}
        {!busy.gen && results.question && (
          <div className="note space-y-3"><p className="eyebrow">Kurze Rückfrage</p><p>{results.question}</p>
            <input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Deine Antwort" />
            <button className="btn w-full" onClick={() => app.generate({ text: req, styles, answer })}>Antworten und Outfits zeigen</button></div>
        )}
        {!busy.gen && results.looks.length > 0 && (
          <>
            {results.greeting && <p className="font-display text-2xl italic leading-snug">{results.greeting}</p>}
            {results.assumptions && <p className="text-sm text-muted"><b className="text-ink">Annahme:</b> {results.assumptions}</p>}
            {results.looks.map((o, i) => <LookCard key={o.id} outfit={o} index={i} adjustable />)}
            {results.missing.length > 0 && <div className="note text-sm"><p className="eyebrow mb-2">Würde deinen Schrank ergänzen</p><p>{results.missing.join(" · ")}</p><p className="mt-2 text-muted">Diese Teile hast du nicht. Die Looks oben funktionieren ohne sie.</p></div>}
          </>
        )}
      </section>

      {favs.length > 0 && (
        <Section title="Favoriten" action={<Link to="/outfits" state={{ filter: "fav" }} className="eyebrow underline underline-offset-4">Alle</Link>}>
          <div className="scrollx">{favs.map((o) => <Link key={o.id} to="/outfits" state={{ open: o.id }} className="w-32 shrink-0"><Photo id={app.items.find((i) => i.id === o.itemIds[0])?.imageId} className="aspect-[4/5]" /><p className="mt-2 truncate text-xs font-medium">{o.label}</p></Link>)}</div>
        </Section>
      )}
    </>
  );
}
const aiOK = (a: ReturnType<typeof useApp>) => a.aiReady;
