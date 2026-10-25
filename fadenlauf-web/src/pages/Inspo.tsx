import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip, ConfirmButton, Dots, FileButton, Field, PageHead, Photo, Section, Sheet } from "../components/ui";
import type { Inspo } from "../lib/types";
import { isHex } from "../lib/util";
import { list } from "../lib/util";
import { useApp } from "../state/AppContext";

export function InspoPage() {
  const app = useApp(); const { inspo, busy, profile } = app; const [open, setOpen] = useState<string | null>(null);
  const up = busy.upload?.kind === "inspo" ? busy.upload : null; const sum = profile!.inspoSummary;
  const cur = inspo.find((x) => x.id === open) ?? null;
  return (
    <>
      <PageHead eyebrow={`${inspo.length} Bilder`} title="Inspirationen" lede="Screenshots von Pinterest, Instagram oder Magazinen. Ich lese den Stil heraus und baue ihn mit deinem Schrank nach." />
      <FileButton multiple label="+ Inspirationsbilder hinzufügen" busy={up && `Analysiere ${up.done + 1} von ${up.total} …`} onFiles={app.uploadInspo} />
      {inspo.length >= 2 && (
        <Section title="Wiederkehrende Muster" action={<button className="btn btn-sm btn-ghost" disabled={busy.pat || !app.aiReady} onClick={app.findPatterns}>{busy.pat ? "Analysiere …" : sum.length ? "Neu erkennen" : "Erkennen"}</button>}>
          {sum.length ? <ul className="list-disc space-y-1 pl-5">{sum.map((s) => <li key={s}>{s}</li>)}</ul> : <p className="text-sm text-muted">Ich vergleiche alle Bilder und merke mir, was dir immer wieder gefällt.</p>}
        </Section>
      )}
      <section className="mt-10">
        {inspo.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {inspo.map((x) => { const a = x.analysis ?? {}; return (
              <button key={x.id} className="text-left" onClick={() => setOpen(x.id)}>
                <Photo id={x.imageId} cover pending={x.status === "pending"} className="aspect-[3/4]" />
                <p className="mt-3 truncate text-sm font-semibold">{x.fav && "♥ "}{x.status === "pending" ? "Wird analysiert …" : a.title || a.style || "Inspiration"}</p>
                <p className="eyebrow !text-[.6rem] mt-0.5">{list(x.tags.length ? x.tags : a.tags).slice(0, 2).join(" · ") || "—"}</p>
              </button>); })}
          </div>
        ) : <p className="py-16 text-center text-muted">Noch keine Inspirationen. Lade Looks hoch, die dir gefallen.</p>}
      </section>
      <Sheet open={!!cur} onClose={() => setOpen(null)} label="Inspiration">{cur && <InspoSheet key={cur.id} x={cur} onClose={() => setOpen(null)} />}</Sheet>
    </>
  );
}

function InspoSheet({ x, onClose }: { x: Inspo; onClose: () => void }) {
  const app = useApp(); const nav = useNavigate(); const a = x.analysis ?? {};
  const [tags, setTags] = useState(x.tags.join(", ")); const [comment, setComment] = useState(x.comment);
  const rows = [["Stil", a.style], ["Teile", list(a.pieces).join(", ")], ["Passform", a.fits], ["Schuhe", a.shoes], ["Accessoires", a.accessories], ["Layering", a.layering]].filter((r) => r[1]);
  const style = () => {
    onClose();
    nav("/", { state: { req: `Look wie meine Inspiration „${a.title || a.style || "Inspiration"}“`, inspiration: JSON.stringify({ stil: a.style, farben: (a.palette ?? []).map((c) => c.name), teile: a.pieces, passform: a.fits, schuhe: a.shoes, accessoires: a.accessories, layering: a.layering, wirkung: a.summary, kommentar: x.comment || undefined }) } });
  };
  return (
    <div className="space-y-5">
      <Photo id={x.imageId} cover className="max-h-96 w-full" />
      <div className="flex items-start justify-between gap-4"><h3>{a.title || a.style || "Inspiration"}</h3><Chip on={x.fav} onClick={() => app.patchInspo(x.id, { fav: !x.fav })} aria-label="Favorit">{x.fav ? "♥" : "♡"}</Chip></div>
      {x.status === "pending" ? <p className="text-muted">Wird analysiert …</p> : a.error ? <p className="note text-sm">{a.error}</p> : (
        <>
          {a.summary && <p className="font-display text-lg italic">{a.summary}</p>}
          {!!a.palette?.length && <div className="flex flex-wrap gap-3">{a.palette.map((c) => <span key={c.name} className="flex items-center gap-2 text-xs"><i className="h-4 w-4 rounded-full border border-line" style={{ background: isHex(c.hex) ? c.hex : "transparent" }} />{c.name}</span>)}</div>}
          <dl className="space-y-3 text-sm">{rows.map(([k, v]) => <div key={k as string}><dt className="eyebrow mb-0.5">{k}</dt><dd>{v}</dd></div>)}<div><dt className="eyebrow mb-0.5">Eleganz</dt><dd><Dots n={Math.max(1, Math.min(5, Math.round(a.elegance || 3)))} /></dd></div></dl>
        </>
      )}
      <Field label="Tags (mit Komma)"><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} /></Field>
      <Field label="Kommentar"><textarea className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Was gefällt dir daran?" /></Field>
      <button className="btn btn-ghost w-full" onClick={async () => { await app.patchInspo(x.id, { tags: list(tags), comment: comment.trim() }); app.toast("Gespeichert."); }}>Tags & Kommentar speichern</button>
      <button className="btn w-full" disabled={x.status === "pending" || !!a.error || app.usable.length < 2 || !app.aiReady} onClick={style}>Mit meinem Schrank nachstylen</button>
      <div className="flex gap-2"><ConfirmButton label="Löschen" sure="Endgültig löschen?" onConfirm={() => { void app.deleteInspo(x); onClose(); }} /><button className="btn btn-sm btn-ghost ml-auto" onClick={onClose}>Schließen</button></div>
    </div>
  );
}
