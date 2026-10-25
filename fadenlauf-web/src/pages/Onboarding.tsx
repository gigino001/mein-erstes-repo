import { useState } from "react";
import { Chip, Field } from "../components/ui";
import { FITS, STYLES, emptyProfile, type Analysis, type Profile } from "../lib/types";
import { toggle } from "../lib/util";
import { useApp } from "../state/AppContext";
import { AnalysisBlock } from "./Profile";

export function Onboarding() {
  const app = useApp(); const [step, setStep] = useState(0); const [d, setD] = useState<Profile>(() => emptyProfile(app.profile?.name ?? "")); const [busy, setBusy] = useState(false);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setD((x) => ({ ...x, [k]: v }));
  const next = () => { if (step === 0 && !d.name.trim()) { app.toast("Wie soll ich dich nennen?"); return; } setStep(step + 1); window.scrollTo(0, 0); };
  const back = () => setStep(step - 1);
  const nav = (last?: boolean) => (
    <div className="flex gap-3 pt-4">
      <button className="btn btn-ghost" onClick={back}>Zurück</button>
      {last ? <button className="btn flex-1" disabled={busy} onClick={async () => { setBusy(true); await app.finishOnboarding({ ...d, name: d.name.trim() }); setBusy(false); }}>{busy ? "Speichere …" : d.analysis ? "Profil speichern" : "Ohne Foto fertigstellen"}</button>
        : <button className="btn flex-1" onClick={next}>Weiter</button>}
    </div>
  );
  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-10 flex gap-1.5" aria-label={`Schritt ${step + 1} von 4`}>{[0, 1, 2, 3].map((i) => <i key={i} className={`h-px flex-1 ${i <= step ? "bg-ink" : "bg-line"}`} />)}</div>
      {step === 0 && (
        <div className="space-y-8 fade-in">
          <div><p className="eyebrow mb-4">Fadenlauf · Dein KI-Stylist</p><h1>Schön, dass du da bist.</h1><p className="mt-5 max-w-[36ch] text-lg text-muted">Ich lerne deinen Kleiderschrank und deinen Geschmack kennen und stelle dir Outfits aus Teilen zusammen, die du wirklich besitzt.</p></div>
          <Field label="Wie soll ich dich nennen?"><input className="input" value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Vorname" autoComplete="given-name" autoFocus /></Field>
          <button className="btn w-full" onClick={next}>Weiter</button>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6 fade-in">
          <div><p className="eyebrow mb-3">Schritt 2 von 4 · Optional</p><h2>Ein paar Eckdaten, {d.name}</h2><p className="mt-2 text-muted">Alles freiwillig. Je mehr ich weiß, desto passender werden die Vorschläge.</p></div>
          <div className="grid grid-cols-2 gap-6"><Field label="Alter"><input type="number" inputMode="numeric" className="input" value={d.age} onChange={(e) => set("age", e.target.value)} /></Field><Field label="Größe (cm)"><input type="number" inputMode="numeric" className="input" value={d.height} onChange={(e) => set("height", e.target.value)} /></Field></div>
          <Field label="Körpermaße"><input className="input" value={d.measures} onChange={(e) => set("measures", e.target.value)} placeholder="z. B. Hemd M, Hose 32/32, Schuhe 43" /></Field>
          <div className="field"><span>Bevorzugte Passformen</span><div className="flex flex-wrap gap-2">{FITS.map((f) => <Chip key={f} on={d.fits.includes(f)} onClick={() => set("fits", toggle(d.fits, f))}>{f}</Chip>)}</div></div>
          <Field label="Lieblingsfarben"><input className="input" value={d.likeColors} onChange={(e) => set("likeColors", e.target.value)} placeholder="z. B. Navy, Beige, Weiß, Braun" /></Field>
          <Field label="Farben, die du nicht magst"><input className="input" value={d.dislikeColors} onChange={(e) => set("dislikeColors", e.target.value)} placeholder="z. B. Neongrün" /></Field>
          <Field label="Lieblingsmarken"><input className="input" value={d.brands} onChange={(e) => set("brands", e.target.value)} /></Field>
          <Field label="Wünsche und modische Ziele"><textarea className="input" value={d.goals} onChange={(e) => set("goals", e.target.value)} placeholder="z. B. Ich möchte erwachsener und stilvoller wirken." /></Field>
          <div className="field"><span>Wo wohnst du?</span><div className="flex gap-2"><Chip on={d.hemisphere === "north"} onClick={() => set("hemisphere", "north")}>Nordhalbkugel</Chip><Chip on={d.hemisphere === "south"} onClick={() => set("hemisphere", "south")}>Südhalbkugel</Chip></div></div>
          {nav()}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6 fade-in">
          <div><p className="eyebrow mb-3">Schritt 3 von 4</p><h2>Welche Richtung gefällt dir?</h2><p className="mt-2 text-muted">Wähle so viele, wie du magst. Du kannst das jederzeit ändern.</p></div>
          <StylesPicker value={d.styles} onChange={(v) => set("styles", v)} />
          <Field label="Eigene Wünsche oder Fragen"><textarea className="input" value={d.styleText} onChange={(e) => set("styleText", e.target.value)} placeholder="z. B. Ich mag italienische Herrenmode. Eleganter, ohne overdressed zu sein." /></Field>
          {nav()}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-6 fade-in">
          <div><p className="eyebrow mb-3">Schritt 4 von 4 · Optional</p><h2>Foto-Check-in</h2><p className="mt-2 text-muted">Lade 1–3 Fotos von dir hoch. Ich leite daraus Farb- und Stilvorschläge ab. Die Fotos werden nur analysiert und nicht gespeichert.</p></div>
          <AnalysisBlock analysis={d.analysis} onChange={(a: Analysis | null) => set("analysis", a)} draftProfile={d} />
          {!app.aiReady && <p className="note text-sm">Für die Foto-Analyse brauchst du später einen KI-Schlüssel (Profil → KI). Du kannst hier ohne Foto fertigstellen.</p>}
          {nav(true)}
        </div>
      )}
    </div>
  );
}

export function StylesPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STYLES.map((s) => (
        <button key={s.k} type="button" aria-pressed={value.includes(s.k)} onClick={() => onChange(toggle(value, s.k))}
          className="border border-line p-4 text-left transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper">
          <b className="font-display text-xl font-medium">{s.k}</b><small className="mt-1 block text-[.78rem] leading-snug opacity-70">{s.d}</small>
        </button>
      ))}
    </div>
  );
}

