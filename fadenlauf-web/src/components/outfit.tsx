import { useState } from "react";
import { roleOf, wornCount, wornToday, type Role } from "../lib/logic";
import { ADJUSTMENTS, REJECT_REASONS, type Item, type Outfit } from "../lib/types";
import { useApp } from "../state/AppContext";
import { AvatarStage, avatarPossible } from "./Avatar";
import { Chip, Dots, Photo, Sheet, cx, useBlob } from "./ui";

const viewMode = () => { try { return localStorage.getItem("fadenlauf-view") || "flat"; } catch { return "flat"; } };

function FlatItem({ item, style, onOpen }: { item: Item; style: React.CSSProperties; onOpen: () => void }) {
  const url = useBlob(item.imageId);
  return <button className="absolute" style={style} onClick={onOpen} aria-label={item.name}>{url && <img src={url} alt="" className="h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,.12)]" />}</button>;
}

/** Flatlay aus freigestellten Fotos. Gibt null zurück, wenn zu wenige Teile freigestellt sind. */
function Flatlay({ items, onOpen }: { items: Item[]; onOpen: (i: Item) => void }) {
  if (items.length < 2 || items.filter((i) => i.cutId && i.imageId === i.cutId).length < items.length / 2) return null;
  const by: Record<Role, Item[]> = { outer: [], mid: [], top: [], bottom: [], shoes: [], acc: [] };
  items.forEach((i) => by[roleOf(i.category)].push(i));
  const upper = [by.outer.shift(), by.mid.shift(), by.top.shift()].filter(Boolean) as Item[];
  const acc = [...by.outer, ...by.mid, ...by.top, ...by.bottom.slice(1), ...by.shoes.slice(1), ...by.acc];
  if (acc.length > 4 || (!upper.length && !by.bottom[0])) return null;
  const dx = acc.length ? 0 : 6; const L = ({ 1: [24], 2: [12, 33], 3: [5, 21, 37] } as Record<number, number[]>)[upper.length] ?? [];
  const pos: [Item, { l: number; t: number; w: number; h: number; z: number }][] = [];
  upper.forEach((i, k) => pos.push([i, { l: L[k] + dx, t: 2 + k * 2, w: 52, h: 43, z: 3 + k }]));
  if (by.bottom[0]) pos.push([by.bottom[0], { l: 22 + dx, t: 39, w: 50, h: 42, z: 2 }]);
  if (by.shoes[0]) pos.push([by.shoes[0], { l: 25 + dx, t: 80, w: 44, h: 19, z: 7 }]);
  acc.forEach((i, k) => pos.push([i, { l: 76, t: 4 + k * 23, w: 23, h: 21, z: 8 }]));
  return (
    <div className="relative aspect-[4/5] w-full bg-tile">
      {pos.map(([i, p]) => <FlatItem key={i.id} item={i} onOpen={() => onOpen(i)} style={{ left: `${p.l}%`, top: `${p.t}%`, width: `${p.w}%`, height: `${p.h}%`, zIndex: p.z }} />)}
    </div>
  );
}
function GridView({ ids, items, onOpen }: { ids: string[]; items: Item[]; onOpen: (i: Item) => void }) {
  const cols = ids.length === 3 || ids.length >= 5 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={cx("grid gap-px bg-line", cols)}>
      {ids.map((id) => { const it = items.find((i) => i.id === id);
        return it ? <button key={id} onClick={() => onOpen(it)} className="relative bg-paper text-left" aria-label={it.name}><Photo id={it.imageId} className="aspect-[4/5]" /><span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-6 text-[.7rem] font-medium text-white">{it.name}</span></button>
          : <div key={id} className="grid aspect-[4/5] place-items-center bg-tile p-2 text-center text-xs text-muted">Teil nicht mehr im Schrank</div>; })}
    </div>
  );
}

export function OutfitVisual({ outfit, onOpen, noToggle }: { outfit: Outfit; onOpen: (i: Item) => void; noToggle?: boolean }) {
  const { items, profile } = useApp(); const [mode, setMode] = useState(viewMode);
  const its = outfit.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as Item[];
  const flat = Flatlay({ items: its, onOpen }); const avatar = avatarPossible(its);
  // Gewünschte Ansicht, sonst die nächstbeste verfügbare
  const shown = mode === "avatar" && avatar ? "avatar" : mode === "flat" && flat ? "flat" : mode === "grid" ? "grid" : flat ? "flat" : avatar ? "avatar" : "grid";
  const pick = (m: string) => { try { localStorage.setItem("fadenlauf-view", m); } catch { /* privat */ } setMode(m); };
  const opts = [flat && ["flat", "Flatlay"], avatar && ["avatar", "Avatar"], ["grid", "Einzelteile"]].filter(Boolean) as [string, string][];
  return (
    <div>
      {shown === "avatar" ? <AvatarStage items={its} settings={profile?.avatar} /> : shown === "flat" ? flat : <GridView ids={outfit.itemIds} items={items} onOpen={onOpen} />}
      {!noToggle && opts.length > 1 && <div className="flex justify-center gap-1.5 border-t border-line bg-surface py-2.5" role="group" aria-label="Ansicht">{opts.map(([k, l]) => <Chip key={k} on={shown === k} onClick={() => pick(k)}>{l}</Chip>)}</div>}
    </div>
  );
}

export function LookCard({ outfit: o, index, adjustable }: { outfit: Outfit; index?: number; adjustable?: boolean }) {
  const app = useApp(); const { wear, busy } = app; const [text, setText] = useState(""); const [sheetItem, setSheetItem] = useState<Item | null>(null);
  const today = wornToday(wear, o.id); const n = wornCount(wear, o.id); const adjBusy = !!busy["adj-" + o.id];
  const issues = app.outfitIssues(o);
  return (
    <article className="card fade-in">
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-3">
        <h3>{o.label}</h3>{index != null && <span className="eyebrow shrink-0">Look {index + 1}</span>}
      </div>
      <OutfitVisual outfit={o} onOpen={setSheetItem} />
      <div className="space-y-5 p-5">
        {issues.length > 0 && <p className="note text-xs">Hinweis: {issues.join(", ")}. Mit „Anpassen“ lässt sich das ergänzen.</p>}
        {o.reason && <p className="font-display text-[1.08rem] italic leading-snug">{o.reason}</p>}
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {o.effect && <div><dt className="eyebrow mb-1">Wirkung</dt><dd>{o.effect}</dd></div>}
          <div><dt className="eyebrow mb-1">Formalität</dt><dd><Dots n={o.formality} /></dd></div>
          {o.tips && <div><dt className="eyebrow mb-1">Schuhe & Extras</dt><dd>{o.tips}</dd></div>}
          {o.context && <div><dt className="eyebrow mb-1">Anlass & Wetter</dt><dd>{o.context}</dd></div>}
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Chip on={o.fav} onClick={() => app.toggleFav(o)}>{o.fav ? "♥ Gespeichert" : "♡ Speichern"}</Chip>
          <Chip on={o.rating === 1} onClick={() => app.setRating(o, 1)}>Gefällt mir</Chip>
          <Chip on={o.rating === -1} onClick={() => app.setRating(o, -1)}>Nicht mein Ding</Chip>
          <Chip on={today} onClick={() => app.toggleWorn(o)}>{today ? "✓ Heute getragen" : "Heute getragen"}{n > 1 ? ` · ${n}×` : ""}</Chip>
        </div>
        {o.rating === -1 && (
          <div><p className="eyebrow mb-2">Was passt nicht? (optional)</p><div className="flex flex-wrap gap-2">{REJECT_REASONS.map((r) => <Chip key={r} on={o.rejectReason === r} onClick={() => app.setReason(o, r)}>{r}</Chip>)}</div></div>
        )}
        {adjustable && (
          <div className="space-y-3 border-t border-line pt-4">
            <p className="eyebrow">Anpassen</p>
            <div className="scrollx">{ADJUSTMENTS.map((a) => <Chip key={a} disabled={adjBusy} onClick={() => app.adjust(o, a)}>{a}</Chip>)}</div>
            <form className="flex items-end gap-3" onSubmit={(e) => { e.preventDefault(); void app.adjust(o, text).then(() => setText("")); }}>
              <input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} placeholder="z. B. Nimm meine braunen Loafer" enterKeyHint="send" aria-label="Änderungswunsch" />
              <button className="btn btn-sm btn-ghost" disabled={adjBusy || !text.trim()}>{adjBusy ? "…" : "Los"}</button>
            </form>
            {adjBusy && <p className="text-xs text-muted">Ich passe den Look an …</p>}
          </div>
        )}
      </div>
      <OutfitItemSheet outfit={o} item={sheetItem} onClose={() => setSheetItem(null)} />
    </article>
  );
}

function OutfitItemSheet({ outfit, item, onClose }: { outfit: Outfit; item: Item | null; onClose: () => void }) {
  const app = useApp(); const v = item ? outfit.itemFeedback?.[item.id] : undefined;
  return (
    <Sheet open={!!item} onClose={onClose} label={item?.name ?? "Teil"}>
      {item && (
        <div className="space-y-5">
          <Photo id={item.imageId} alt={item.name} className="aspect-square" />
          <h3>{item.name}</h3>
          <p className="eyebrow">{item.category} · {item.color} · Formalität {item.formality}</p>
          {(item.material || item.fit) && <p className="text-sm">{[item.material, item.fit, item.details].filter(Boolean).join(" · ")}</p>}
          <div><p className="eyebrow mb-2">Passt es in diesem Look?</p><div className="flex gap-2"><Chip on={v === 1} onClick={() => app.setItemFeedback(outfit, item.id, 1)}>Passt gut</Chip><Chip on={v === -1} onClick={() => app.setItemFeedback(outfit, item.id, -1)}>Passt hier nicht</Chip></div></div>
          <button className="btn btn-ghost w-full" onClick={onClose}>Schließen</button>
        </div>
      )}
    </Sheet>
  );
}
