import { useEffect, useRef, useState, type ReactNode } from "react";
import { useApp } from "../state/AppContext";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

/** Bild aus dem Store (lokal oder signierte Supabase-URL). */
export function useBlob(id?: string | null) {
  const { store } = useApp(); const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true; setUrl(null);
    if (id && store) store.blobUrl(id).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(null));
    return () => { alive = false; };
  }, [id, store]);
  return url;
}
export function Photo({ id, alt = "", cover, className, pending }: { id?: string | null; alt?: string; cover?: boolean; className?: string; pending?: boolean }) {
  const url = useBlob(id);
  return (
    <div className={cx("photo relative", className)}>
      {url ? <img src={url} alt={alt} loading="lazy" className={cover ? "cover" : ""} /> : <span className="eyebrow !text-[.6rem] opacity-60">{id ? "…" : "Kein Foto"}</span>}
      {pending && <div className="skel absolute inset-0 opacity-70" />}
    </div>
  );
}

export function Chip({ on, children, ...p }: { on?: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="chip" aria-pressed={on} {...p}>{children}</button>;
}
export const Dots = ({ n }: { n: number }) => <span aria-label={`${n} von 5`} className="tracking-[.25em] text-gold">{"●".repeat(n)}<span className="opacity-30">{"●".repeat(5 - n)}</span></span>;

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cx("field", className)}><span>{label}</span>{children}</label>;
}
export function PageHead({ eyebrow, title, lede }: { eyebrow?: string; title: string; lede?: string }) {
  return (
    <header className="pt-10 pb-6 fade-in">
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1>{title}</h1>
      {lede && <p className="mt-4 max-w-[38ch] text-muted">{lede}</p>}
    </header>
  );
}
export const Section = ({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cx("mt-10", className)}>
    {title && <div className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-2"><h3>{title}</h3>{action}</div>}
    {children}
  </section>
);

/** Natives <dialog>: Fokus-Falle, Escape und Fokus-Rückgabe kommen vom Browser. */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current; if (!d) return;
    if (open && !d.open) { d.showModal(); document.body.style.overflow = "hidden"; }
    if (!open && d.open) d.close();
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" aria-label={label} onClose={() => { document.body.style.overflow = ""; onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {open && <div className="p-6 pb-10 sm:p-8">{children}</div>}
    </dialog>
  );
}

/** Zweistufiger Löschen-Button ohne window.confirm. */
export function ConfirmButton({ label, sure, onConfirm, className }: { label: string; sure: string; onConfirm: () => void; className?: string }) {
  const [ask, setAsk] = useState(false);
  useEffect(() => { if (!ask) return; const t = setTimeout(() => setAsk(false), 6000); return () => clearTimeout(t); }, [ask]);
  return ask
    ? <span className="inline-flex gap-2"><button className={cx("btn btn-sm btn-danger", className)} onClick={() => { setAsk(false); onConfirm(); }}>{sure}</button><button className="btn btn-sm btn-ghost" onClick={() => setAsk(false)}>Abbrechen</button></span>
    : <button className={cx("btn btn-sm btn-ghost btn-danger", className)} onClick={() => setAsk(true)}>{label}</button>;
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      {toasts.map((t) => (
        <div key={t.id} className="fade-in pointer-events-auto flex max-w-md items-center gap-4 bg-ink px-5 py-3 text-sm text-paper shadow-xl">
          <span>{t.text}</span>
          {t.action && <button className="shrink-0 font-bold uppercase tracking-widest text-[.66rem] text-gold underline-offset-4 hover:underline" onClick={t.action.run}>{t.action.label}</button>}
        </div>
      ))}
    </div>
  );
}
export const Spinner = () => <div className="grid min-h-[60dvh] place-items-center"><div className="skel h-14 w-14 rounded-full" /></div>;

export function FileButton({ label, busy, accept = "image/*", multiple, onFiles, ghost }: { label: string; busy?: string | false; accept?: string; multiple?: boolean; onFiles: (f: File[]) => void; ghost?: boolean }) {
  return (
    <label className={cx("btn relative w-full cursor-pointer overflow-hidden", ghost && "btn-ghost", busy && "pointer-events-none opacity-60")}>
      {busy || label}
      <input type="file" accept={accept} multiple={multiple} disabled={!!busy} className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) onFiles(f); }} />
    </label>
  );
}
