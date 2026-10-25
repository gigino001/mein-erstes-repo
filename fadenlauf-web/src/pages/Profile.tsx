import { useState } from "react";
import { Chip, ConfirmButton, Field, FileButton, PageHead, Section } from "../components/ui";
import { AvatarStage } from "../components/Avatar";
import { FITS, SKIN_TONES, defaultAvatar, type Analysis, type Profile } from "../lib/types";
import { isHex, list, toggle } from "../lib/util";
import { useApp } from "../state/AppContext";
import { StylesPicker } from "./Onboarding";
import { MODEL_MB, getCutMode, setCutMode, type CutMode } from "../lib/mlCutout";

export function AnalysisBlock({ analysis: a, onChange, draftProfile, saveLabel }: { analysis: Analysis | null; onChange: (a: Analysis | null) => void | Promise<void>; draftProfile: Profile; saveLabel?: string }) {
  const app = useApp(); const [draft, setDraft] = useState(a); const dirty = JSON.stringify(draft) !== JSON.stringify(a);
  const up = <FileButton ghost multiple busy={app.busy.photo && "Analysiere Fotos …"} label={a ? "Neue Fotos analysieren" : "Fotos auswählen oder aufnehmen"} onFiles={(f) => app.aiReady ? app.stylePhotos(f, (r) => { setDraft(r); return onChange(r); }) : app.toast("Hinterlege zuerst einen KI-Schlüssel (Profil → KI).")} />;
  void draftProfile;
  if (!draft) return up;
  return (
    <div className="space-y-5">
      <div className="note space-y-4">
        <div className="flex items-center justify-between"><p className="eyebrow">Deine Style-Analyse</p><span className="eyebrow !text-gold">Vorschlag</span></div>
        <p className="text-sm">{draft.features}</p>
        {draft.palette.length > 0 && <div className="flex flex-wrap gap-3">{draft.palette.map((c) => <span key={c.name} className="flex items-center gap-2 text-xs"><i className="h-4 w-4 rounded-full border border-line" style={{ background: isHex(c.hex) ? c.hex : "transparent" }} />{c.name}</span>)}</div>}
        <Field label="Schnitte & Proportionen"><textarea className="input" value={draft.cuts} onChange={(e) => setDraft({ ...draft, cuts: e.target.value })} /></Field>
        <Field label="Kombinationen"><textarea className="input" value={draft.combos} onChange={(e) => setDraft({ ...draft, combos: e.target.value })} /></Field>
        <Field label="Looks zum Ausprobieren"><textarea className="input" value={draft.tryLooks.join("\n")} onChange={(e) => setDraft({ ...draft, tryLooks: e.target.value.split("\n") })} /></Field>
        {draft.styles.length > 0 && <p className="text-xs text-muted">Mögliche Richtungen: {draft.styles.join(", ")}</p>}
        {saveLabel && <button className="btn btn-sm btn-ghost" disabled={!dirty} onClick={() => onChange({ ...draft, tryLooks: draft.tryLooks.map((s) => s.trim()).filter(Boolean) })}>{saveLabel}</button>}
        {!saveLabel && dirty && <button className="btn btn-sm btn-ghost" onClick={() => onChange(draft)}>Änderungen übernehmen</button>}
      </div>
      {up}
    </div>
  );
}

export function ProfilePage() {
  const app = useApp(); const p = app.profile!; const [f, setF] = useState(p); const dirty = JSON.stringify(f) !== JSON.stringify(p);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setF((x) => ({ ...x, [k]: v }));
  const L = p.learned; const occ = Object.entries(L.occasions);
  const save = async () => {
    if (!f.name.trim()) { app.toast("Der Name darf nicht leer sein."); return; }
    try { await app.patchProfile({ name: f.name.trim(), age: f.age, height: f.height, measures: f.measures.trim(), fits: f.fits, likeColors: f.likeColors.trim(), dislikeColors: f.dislikeColors.trim(), brands: f.brands.trim(), goals: f.goals.trim(), styles: f.styles, styleText: f.styleText.trim(), hemisphere: f.hemisphere }); app.toast("Profil gespeichert."); } catch (e) { app.fail(e); }
  };
  const unlearn = (grp: string, i: number) => {
    const next = structuredClone(L);
    if (grp === "general") next.general.splice(i, 1); else { const a = [...list(next.occasions[grp])]; a.splice(i, 1); if (a.length) next.occasions[grp] = a; else delete next.occasions[grp]; }
    void app.patchProfile({ learned: next }).catch(app.fail);
  };
  const download = (name: string, text: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  return (
    <>
      <PageHead eyebrow="Stilprofil" title={p.name} />
      <Section title="Stilrichtungen" className="!mt-0"><div className="space-y-6"><StylesPicker value={f.styles} onChange={(v) => set("styles", v)} /><Field label="Eigene Wünsche"><textarea className="input" value={f.styleText} onChange={(e) => set("styleText", e.target.value)} /></Field></div></Section>
      <Section title="Über dich"><div className="space-y-6">
        <Field label="Name für die Ansprache"><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-6"><Field label="Alter"><input type="number" className="input" value={f.age} onChange={(e) => set("age", e.target.value)} /></Field><Field label="Größe (cm)"><input type="number" className="input" value={f.height} onChange={(e) => set("height", e.target.value)} /></Field></div>
        <Field label="Körpermaße"><input className="input" value={f.measures} onChange={(e) => set("measures", e.target.value)} /></Field>
        <div className="field"><span>Passformen</span><div className="flex flex-wrap gap-2">{FITS.map((x) => <Chip key={x} on={f.fits.includes(x)} onClick={() => set("fits", toggle(f.fits, x))}>{x}</Chip>)}</div></div>
        <Field label="Lieblingsfarben"><input className="input" value={f.likeColors} onChange={(e) => set("likeColors", e.target.value)} /></Field>
        <Field label="Farben, die du nicht magst"><input className="input" value={f.dislikeColors} onChange={(e) => set("dislikeColors", e.target.value)} /></Field>
        <Field label="Marken"><input className="input" value={f.brands} onChange={(e) => set("brands", e.target.value)} /></Field>
        <Field label="Ziele"><textarea className="input" value={f.goals} onChange={(e) => set("goals", e.target.value)} /></Field>
        <div className="field"><span>Halbkugel (für die Jahreszeit)</span><div className="flex gap-2"><Chip on={f.hemisphere === "north"} onClick={() => set("hemisphere", "north")}>Nord</Chip><Chip on={f.hemisphere === "south"} onClick={() => set("hemisphere", "south")}>Süd</Chip></div></div>
        <button className="btn w-full" disabled={!dirty} onClick={save}>{dirty ? "Änderungen speichern" : "Gespeichert"}</button>
      </div></Section>
      <Section title="Avatar">
        <p className="mb-4 text-sm text-muted">Deine Outfits erscheinen auf einer Figur und tragen genau die Fotos deiner Teile. Passe Figur und Hautton an.</p>
        <div className="grid items-start gap-6 sm:grid-cols-2">
          <AvatarStage items={[]} settings={p.avatar ?? defaultAvatar} />
          <div className="space-y-5">
            <div className="field"><span>Figur</span><div className="flex flex-wrap gap-2">{([["slim", "Schlank"], ["normal", "Normal"], ["strong", "Kräftig"]] as const).map(([k, l]) => <Chip key={k} on={(p.avatar ?? defaultAvatar).build === k} onClick={() => void app.patchProfile({ avatar: { ...(p.avatar ?? defaultAvatar), build: k } }).catch(app.fail)}>{l}</Chip>)}</div></div>
            <div className="field"><span>Hautton</span><div className="flex flex-wrap gap-3">{SKIN_TONES.map((c) => <button key={c} aria-label={`Hautton ${c}`} aria-pressed={(p.avatar ?? defaultAvatar).skin === c} onClick={() => void app.patchProfile({ avatar: { ...(p.avatar ?? defaultAvatar), skin: c } }).catch(app.fail)} className="h-9 w-9 rounded-full border border-line aria-pressed:ring-2 aria-pressed:ring-gold aria-pressed:ring-offset-2 aria-pressed:ring-offset-paper" style={{ background: c }} />)}</div></div>
            <p className="note text-xs">Das ist eine Zeichnung, kein Foto von dir. Eine echte Anprobe an deinem Körper braucht einen bezahlten Bild-KI-Dienst und ist als späterer Ausbau vorgesehen.</p>
          </div>
        </div>
      </Section>
      <CutSection />
      <Section title="Foto-Style-Analyse"><AnalysisBlock analysis={p.analysis} draftProfile={p} saveLabel="Analyse-Texte speichern" onChange={async (a) => { try { await app.patchProfile({ analysis: a }); app.toast("Style-Analyse gespeichert."); } catch (e) { app.fail(e); } }} /></Section>
      <Section title="Was ich gelernt habe" action={<button className="btn btn-sm btn-ghost" disabled={app.busy.learn || !app.aiReady} onClick={() => app.learn(false)}>{app.busy.learn ? "Lerne …" : "Aus Feedback lernen"}</button>}>
        <p className="mb-4 text-sm text-muted">Ich aktualisiere das nach jeweils vier Bewertungen automatisch. Tippe auf ×, um etwas zu streichen.</p>
        {L.general.length ? <div className="field"><span>Allgemein</span><div className="flex flex-wrap gap-2">{L.general.map((g, i) => <Chip key={g} onClick={() => unlearn("general", i)}>{g} ×</Chip>)}</div></div> : <p className="note text-sm text-muted">Noch nichts gelernt. Bewerte ein paar Outfits.</p>}
        {occ.map(([k, v]) => <div key={k} className="field mt-4"><span>Nur für: {k}</span><div className="flex flex-wrap gap-2">{list(v).map((g, i) => <Chip key={g} onClick={() => unlearn(k, i)}>{g} ×</Chip>)}</div></div>)}
        {(L.general.length > 0 || occ.length > 0) && <div className="mt-4"><ConfirmButton label="Gelerntes zurücksetzen" sure="Ja, alles Gelernte löschen" onConfirm={() => void app.patchProfile({ learned: { general: [], occasions: {} }, fbCount: 0 }).then(() => app.toast("Gelerntes zurückgesetzt."))} /></div>}
      </Section>
      {app.store?.kind === "local" && <KeySection />}
      <Section title="Daten & Konto"><div className="space-y-5">
        <p className="text-sm text-muted">{app.store?.kind === "cloud" ? "Dein Schrank, deine Bewertungen und dein Profil sind privat und nur mit deinem Login sichtbar." : "Lokal-Modus: Alles liegt nur in diesem Browser. Exportiere regelmäßig eine Sicherung."}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-sm btn-ghost" onClick={() => download("fadenlauf-export.json", app.exportAll())}>Daten exportieren (JSON)</button>
          <label className="btn btn-sm btn-ghost relative cursor-pointer overflow-hidden">Alten Export importieren<input type="file" accept="application/json,.json" className="absolute inset-0 opacity-0" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) await app.importOld(await file.text()); }} /></label>
          {app.store?.kind === "cloud" && <button className="btn btn-sm btn-ghost" onClick={app.signOut}>Abmelden</button>}
        </div>
        <ConfirmButton label="Alle meine Daten löschen" sure="Ja, Schrank, Outfits und Profil endgültig löschen" onConfirm={app.wipeAll} />
      </div></Section>
    </>
  );
}

function KeySection() {
  const app = useApp(); const [provider, setProvider] = useState<"gemini" | "anthropic">(app.keyCfg?.provider ?? "gemini"); const [key, setKey] = useState(app.keyCfg?.key ?? "");
  return (
    <Section title="KI">
      <div className="space-y-4">
        <p className="text-sm text-muted">Im Lokal-Modus brauchst du einen eigenen Schlüssel. Er bleibt in diesem Browser und geht nur an den gewählten Anbieter. Mit Google Gemini gibt es ein kostenloses Kontingent (Schlüssel auf aistudio.google.com).</p>
        <div className="flex gap-2"><Chip on={provider === "gemini"} onClick={() => setProvider("gemini")}>Google Gemini</Chip><Chip on={provider === "anthropic"} onClick={() => setProvider("anthropic")}>Claude (Anthropic)</Chip></div>
        <Field label="API-Schlüssel"><input type="password" className="input" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" placeholder={provider === "gemini" ? "AIza…" : "sk-ant-…"} /></Field>
        <div className="flex gap-2"><button className="btn btn-sm" disabled={!key.trim()} onClick={() => { app.setKey({ provider, key: key.trim() }); app.toast("Schlüssel gespeichert."); }}>Speichern</button>{app.keyCfg && <button className="btn btn-sm btn-ghost" onClick={() => { app.setKey(null); setKey(""); }}>Entfernen</button>}</div>
        <p className="text-xs text-muted">Hinweis: Im kostenlosen Gemini-Tarif dürfen eingesendete Inhalte laut Google zur Produktverbesserung genutzt werden. Für Selfies und private Fotos ist ein bezahlter Tarif oder die Claude-API die bessere Wahl.</p>
      </div>
    </Section>
  );
}

function CutSection() {
  const app = useApp(); const [mode, setMode] = useState<CutMode>(getCutMode); const rc = app.busy.recut;
  const pick = (m: CutMode) => { setCutMode(m); setMode(m); };
  return (
    <Section title="Freistellen">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2"><Chip on={mode === "ml"} onClick={() => pick("ml")}>KI (empfohlen)</Chip><Chip on={mode === "fast"} onClick={() => pick("fast")}>Schnell</Chip></div>
        <p className="text-sm text-muted">{mode === "ml" ? `Ein KI-Modell auf deinem Gerät schneidet die Teile aus, auch vor ähnlich farbigem Hintergrund. Beim ersten Mal lädt es einmalig ca. ${MODEL_MB} MB. Deine Fotos verlassen dafür das Gerät nicht.` : "Die einfache Farbmethode ist schneller, braucht keinen Download, scheitert aber bei Hintergründen, die dem Teil ähneln."}</p>
        <button className="btn btn-sm btn-ghost" disabled={!!rc || app.items.length === 0} onClick={app.recutEverything}>{rc ? `Stelle frei: ${rc.done} von ${rc.total} …` : "Alle Teile neu freistellen"}</button>
        <p className="text-xs text-muted">Nutzt die oben gewählte Methode. Misslingt ein Teil, bleibt das bisherige Bild bestehen. Nicht-kommerzielle Lizenz des Modells (RMBG-1.4 von Bria).</p>
      </div>
    </Section>
  );
}
