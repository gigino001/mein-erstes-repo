import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Ai } from "../lib/ai";
import { DirectAi, EdgeAi, loadKey, noAi, saveKey, type KeyConfig } from "../lib/ai";
import { cutoutBlob, prepImage } from "../lib/cutout";
import { AppError, errText } from "../lib/errors";
import { parseOldExport } from "../lib/importOld";
import { cleanOutfit, outfitIssues, usable, wornToday } from "../lib/logic";
import * as P from "../lib/prompts";
import * as Z from "../lib/schemas";
import { LocalStore } from "../lib/store/local";
import { SupabaseStore, supabase, supabaseConfigured } from "../lib/store/supabase";
import type { Store } from "../lib/store/types";
import { CATS, STYLES, SEASONS, emptyProfile, type Analysis, type Col, type Collections, type Inspo, type Item, type Outfit, type Profile, type Trip, type WearEntry } from "../lib/types";
import { clamp5, isHex, list, shortCat, uid } from "../lib/util";
import { loadWx, saveWx } from "../lib/weather";

export type Toast = { id: number; text: string; action?: { label: string; run: () => void } };
type Phase = "loading" | "auth" | "ready";
type Results = { looks: Outfit[]; greeting: string; assumptions: string; missing: string[]; question: string | null };
const noResults: Results = { looks: [], greeting: "", assumptions: "", missing: [], question: null };

function useAppState() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [store, setStore] = useState<Store | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [inspo, setInspo] = useState<Inspo[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [wear, setWear] = useState<WearEntry[]>([]);
  const [results, setResults] = useState<Results>(noResults);
  const [busy, setBusy] = useState<Record<string, any>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [wx, setWxState] = useState(loadWx);
  const [keyCfg, setKeyCfg] = useState<KeyConfig | null>(loadKey);
  const saved = useRef(new Set<string>());
  const live = useRef({ profile, items, outfits, wear, inspo, wx });
  live.current = { profile, items, outfits, wear, inspo, wx };

  const toast = useCallback((text: string, action?: Toast["action"]) => {
    const id = Date.now() + Math.random(); setToasts((t) => [...t.slice(-2), { id, text, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 7000 : 3800);
  }, []);
  const fail = useCallback((e: unknown) => { console.error(e); toast(errText(e)); }, [toast]);
  const setBusyKey = (k: string, v: any) => setBusy((b) => ({ ...b, [k]: v }));

  const ai: Ai = useMemo(() => (store?.kind === "cloud" ? new EdgeAi() : keyCfg ? new DirectAi(keyCfg) : noAi), [store, keyCfg]);
  const aiReady = store?.kind === "cloud" || !!keyCfg;

  /* ---------- Start ---------- */
  const load = useCallback(async (s: Store) => {
    const [pr, it, ins, out, tr, we] = await Promise.all([s.getProfile(), s.list("items"), s.list("inspo"), s.list("outfits"), s.list("trips"), s.list("wear")]);
    out.forEach((o) => saved.current.add(o.id));
    setStore(s); setProfile(pr); setItems(it); setInspo(ins); setOutfits(out); setTrips(tr); setWear(we); setPhase("ready");
  }, []);
  useEffect(() => {
    (async () => {
      try {
        if (!supabaseConfigured()) { await load(new LocalStore()); return; }
        const { data } = await supabase().auth.getSession();
        if (data.session) await load(new SupabaseStore(data.session.user.id)); else setPhase("auth");
        supabase().auth.onAuthStateChange(async (ev, session) => {
          if (ev === "SIGNED_IN" && session) await load(new SupabaseStore(session.user.id));
          if (ev === "SIGNED_OUT") { setStore(null); setProfile(null); setPhase("auth"); }
        });
      } catch (e) { console.error(e); setPhase(supabaseConfigured() ? "auth" : "ready"); }
    })();
  }, [load]);

  /* ---------- kleine Helfer für Sammlungen ---------- */
  const setters = { items: setItems, inspo: setInspo, outfits: setOutfits, trips: setTrips, wear: setWear } as unknown as Record<Col, (f: (p: any[]) => any[]) => void>;
  const putDoc = useCallback(async <C extends Col>(col: C, doc: Collections[C]) => { await store!.put(col, doc); setters[col]((p) => [doc, ...p.filter((x) => x.id !== (doc as any).id)]); }, [store]); // eslint-disable-line
  const patchDoc = useCallback(async <C extends Col>(col: C, id: string, patch: Partial<Collections[C]>) => {
    await store!.patch(col, id, patch); setters[col]((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }, [store]); // eslint-disable-line
  const delDoc = useCallback(async (col: Col, id: string) => { await store!.remove(col, id); setters[col]((p) => p.filter((x) => x.id !== id)); }, [store]); // eslint-disable-line

  const patchProfile = useCallback(async (patch: Partial<Profile>) => {
    await store!.patchProfile(patch); setProfile((p) => (p ? { ...p, ...patch } : p));
  }, [store]);
  const ctx = (): P.Ctx => ({ profile: live.current.profile!, items: live.current.items, outfits: live.current.outfits, wear: live.current.wear, wx: live.current.wx });
  const allCats = () => [...CATS, ...(live.current.profile?.customCats ?? [])];

  /* ---------- Profil ---------- */
  const finishOnboarding = async (draft: Partial<Profile>) => {
    try {
      const p: Profile = { ...emptyProfile(draft.name), ...draft, onboarded: true, createdAt: Date.now() };
      await store!.setProfile(p); setProfile(p);
    } catch (e) { fail(e); }
  };
  const stylePhotos = async (files: File[], onDone: (a: Analysis) => void | Promise<void>) => {
    setBusyKey("photo", true);
    try {
      const imgs = await Promise.all(files.slice(0, 3).map((f) => prepImage(f, 1200)));
      const a = Z.StyleAnalysisSchema.parse(await ai.json(P.stylePhotosPrompt(live.current.profile ?? emptyProfile()), imgs));
      await onDone({ ...a, palette: a.palette.filter((c) => isHex(c.hex)).slice(0, 8), createdAt: Date.now() });
    } catch (e) { fail(e); } finally { setBusyKey("photo", false); }
  };

  /* ---------- Lernen ---------- */
  const learn = async (silent = false) => {
    if (!aiReady || !live.current.profile) return;
    setBusyKey("learn", true);
    try {
      const r = Z.LearnResponse.parse(await ai.json(P.learnPrompt(ctx())));
      const occasions: Record<string, string[]> = {};
      Object.entries(r.occasions).forEach(([k, v]) => { const a = list(v).slice(0, 5); if (a.length) occasions[k.slice(0, 40)] = a; });
      await patchProfile({ learned: { general: r.general.slice(0, 8), occasions, updatedAt: Date.now() }, fbCount: 0 });
      if (!silent) toast("Stilprofil aktualisiert.");
    } catch (e) { if (!silent) fail(e); } finally { setBusyKey("learn", false); }
  };
  const bumpFeedback = async () => {
    const n = (live.current.profile?.fbCount ?? 0) + 1;
    try { await patchProfile({ fbCount: n }); } catch { return; }
    if (n >= 4) void learn(true);
  };

  /* ---------- Outfits ---------- */
  const outfitById = (id: string) => live.current.outfits.find((o) => o.id === id) ?? results.looks.find((o) => o.id === id);
  /** Vorschläge werden erst gespeichert, wenn man damit etwas macht (Herz, Bewertung, Tragen, Teil-Feedback). */
  const persist = async (id: string) => {
    if (saved.current.has(id)) return live.current.outfits.find((o) => o.id === id)!;
    const o = results.looks.find((x) => x.id === id)!; saved.current.add(id); await putDoc("outfits", o); return o;
  };
  const updateLook = (id: string, patch: Partial<Outfit>) => setResults((r) => ({ ...r, looks: r.looks.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
  const rate = async (id: string, patch: Partial<Outfit>, counts: boolean) => {
    try { await persist(id); await patchDoc("outfits", id, patch); updateLook(id, patch); if (counts) void bumpFeedback(); } catch (e) { fail(e); }
  };
  const toggleFav = (o: Outfit) => rate(o.id, { fav: !o.fav }, !o.fav);
  const setRating = (o: Outfit, v: 1 | -1) => rate(o.id, { rating: o.rating === v ? 0 : v, rejectReason: null }, o.rating !== v);
  const setReason = (o: Outfit, r: string) => rate(o.id, { rejectReason: o.rejectReason === r ? null : r }, false);
  const setItemFeedback = (o: Outfit, itemId: string, v: 1 | -1) => {
    const cur = o.itemFeedback?.[itemId]; return rate(o.id, { itemFeedback: { ...(o.itemFeedback ?? {}), [itemId]: cur === v ? 0 : v } }, cur !== v);
  };
  const toggleWorn = async (o: Outfit) => {
    try {
      await persist(o.id);
      const today = wornToday(live.current.wear, o.id);
      if (today) { for (const w of live.current.wear.filter((x) => x.outfitId === o.id && wornToday([x], o.id))) await delDoc("wear", w.id); }
      else { await putDoc("wear", { id: uid(), outfitId: o.id, itemIds: o.itemIds, date: Date.now() }); toast("Eingetragen. Diese Teile schlage ich die nächsten Tage seltener vor."); void bumpFeedback(); }
    } catch (e) { fail(e); }
  };

  const generate = async (req: { text: string; styles: string[]; answer?: string; inspiration?: string; label?: string }) => {
    if (busy.gen) return;
    setBusyKey("gen", true); setResults({ ...noResults });
    try {
      const raw = await ai.json(P.generatePrompt(ctx(), { ...req, shown: results.looks }));
      const r = Z.GenerateResponse.parse(raw);
      if (r.question && !r.outfits.length) { setResults({ ...noResults, question: r.question }); return; }
      const request = req.label || req.text.trim() || "Outfit für heute"; const looks: Outfit[] = [];
      for (const o of r.outfits.slice(0, 3)) {
        const c = cleanOutfit(o, live.current.items);
        if (c) looks.push({ ...c, id: uid(), request, assumptions: r.assumptions, createdAt: Date.now(), rating: 0, fav: false });
      }
      if (!looks.length) { toast("Ich konnte aus deinem Schrank kein vollständiges Outfit bauen. Füge mehr Teile hinzu oder formuliere die Anfrage anders."); return; }
      setResults({ looks, greeting: r.greeting, assumptions: r.assumptions, missing: r.missing.slice(0, 5), question: null });
    } catch (e) { fail(e); } finally { setBusyKey("gen", false); }
  };
  const adjust = async (o: Outfit, instr: string) => {
    const key = "adj-" + o.id; if (busy[key] || !instr.trim()) return;
    setBusyKey(key, true);
    try {
      const r = Z.AdjustResponse.parse(await ai.json(P.adjustPrompt(ctx(), o, instr)));
      const c = cleanOutfit(r.outfit, live.current.items);
      if (saved.current.has(o.id)) await patchDoc("outfits", o.id, { adjustments: [...(o.adjustments ?? []), instr] });
      if (!c || c.itemIds.slice().sort().join() === o.itemIds.slice().sort().join()) { toast(r.changed || "Keine passende Alternative im Schrank gefunden."); return; }
      const next: Outfit = { ...c, id: uid(), request: o.request, parent: o.id, createdAt: Date.now(), rating: 0, fav: false, adjustments: [instr] };
      if (saved.current.has(o.id)) { await patchDoc("outfits", o.id, { replaced: true }); }
      setResults((s) => ({ ...s, looks: s.looks.map((x) => (x.id === o.id ? next : x)) }));
      if (r.changed) toast(r.changed);
    } catch (e) { fail(e); } finally { setBusyKey(key, false); }
  };

  /* ---------- Schrank ---------- */
  const itemFromAI = (a: Z.ItemAnalysisT): Partial<Item> => {
    const cats = allCats();
    const cat = cats.includes(a.category) ? a.category : cats.find((c) => a.category.toLowerCase().includes(shortCat(c).toLowerCase().slice(0, 5))) ?? "Weitere Accessoires";
    const unc = [...a.uncertain]; if (!cats.includes(a.category) && !unc.includes("category")) unc.push("category");
    return {
      status: "ready", name: (a.name || "Kleidungsstück").slice(0, 80), category: cat, color: a.color, colorHex: isHex(a.colorHex) ? a.colorHex : undefined, pattern: a.pattern, material: a.material,
      details: a.details, fit: a.fit, styles: a.styles.filter((s) => STYLES.some((x) => x.k === s)), seasons: a.seasons.filter((s) => (SEASONS as readonly string[]).includes(s)),
      weather: a.weather, formality: clamp5(a.formality), occasions: a.occasions.slice(0, 6), uncertain: unc,
    };
  };
  const uploadItems = async (files: File[]) => {
    files = files.slice(0, 20); setBusyKey("upload", { done: 0, total: files.length, cut: 0 }); let cutCount = 0, done = 0;
    for (const f of files) {
      const made: string[] = [];
      try {
        const img = await prepImage(f); const orig = await store!.putBlob(img); made.push(orig);
        let cut: string | null = null;
        try { const b = await cutoutBlob(img); if (b) { cut = await store!.putBlob(b); made.push(cut); cutCount++; } } catch (e) { console.warn("cutout", e); }
        const id = uid();
        const base: Item = { id, imageId: cut ?? orig, origId: orig, cutId: cut, cutTried: true, status: "pending", createdAt: Date.now(), category: "Weitere Accessoires", name: "", color: "", pattern: "", material: "", details: "", fit: "", styles: [], seasons: [], weather: "", formality: 3, occasions: [], uncertain: [] };
        await putDoc("items", base);
        try {
          const a = Z.ItemAnalysis.parse(await ai.json(P.analyzeItemPrompt(allCats()), [img]));
          if (a.error) { await patchDoc("items", id, { status: "manual", name: "Bitte prüfen", notes: a.error, uncertain: ["name", "category"] }); toast("Auf einem Foto war kein Kleidungsstück klar erkennbar. Bitte von Hand ausfüllen."); }
          else await patchDoc("items", id, itemFromAI(a));
        } catch (e) { await patchDoc("items", id, { status: "manual", name: "Bitte prüfen", uncertain: ["name", "category", "color"] }); fail(e); }
      } catch (e) { for (const id of made) await store!.removeBlob(id).catch(() => {}); fail(e); } // keine verwaisten Bilder
      done++; setBusyKey("upload", { done, total: files.length, cut: cutCount });
    }
    setBusyKey("upload", null);
    const miss = done - cutCount;
    toast(miss ? `${done} Teile hinzugefügt, ${cutCount} freigestellt. Bei ${miss} war der Hintergrund zu unruhig: Teil öffnen und „Neu freistellen“ probieren.` : `${done} ${done === 1 ? "Teil" : "Teile"} hinzugefügt und freigestellt.`);
  };
  const blobOf = async (id: string) => { const r = await fetch(await store!.blobUrl(id)); if (!r.ok) throw new AppError("offline"); return r.blob(); };
  const recut = async (i: Item, tol = 1) => {
    setBusyKey("cut-" + i.id, true);
    try {
      const src = i.origId || i.imageId; const b = await cutoutBlob(await blobOf(src), tol);
      if (!b) { await patchDoc("items", i.id, { cutTried: true }); toast("Der Hintergrund ließ sich nicht sauber trennen. Probier „Fein“ oder „Grob“ oder ein Foto auf einfarbigem Untergrund."); return; }
      const id = await store!.putBlob(b); const old = i.cutId;
      await patchDoc("items", i.id, { origId: src, cutId: id, imageId: id, cutTried: true });
      if (old && old !== src) void store!.removeBlob(old).catch(() => {}); toast("Neu freigestellt.");
    } catch (e) { fail(e); } finally { setBusyKey("cut-" + i.id, false); }
  };
  const recutAll = async () => {
    // Nur Teile, die noch nie versucht wurden: das Banner verschwindet danach (alter Fehler: Dauerschleife).
    const todo = live.current.items.filter((i) => !i.cutId && !i.cutTried && i.imageId && i.status !== "pending");
    setBusyKey("recut", { done: 0, total: todo.length }); let ok = 0, done = 0;
    for (const i of todo) {
      try {
        const src = i.origId || i.imageId; const b = await cutoutBlob(await blobOf(src)); let cut: string | null = null; if (b) { cut = await store!.putBlob(b); ok++; }
        await patchDoc("items", i.id, { origId: src, cutId: cut, imageId: cut ?? src, cutTried: true });
      } catch (e) { if ((e as AppError).code === "offline") { toast("Die Fotos konnten nicht geladen werden."); break; } }
      setBusyKey("recut", { done: ++done, total: todo.length });
    }
    setBusyKey("recut", null); toast(`${ok} von ${todo.length} Teilen freigestellt.`);
  };
  const saveItem = async (id: string, patch: Partial<Item>, newCat?: string) => {
    try {
      if (newCat && !allCats().includes(newCat)) await patchProfile({ customCats: [...(live.current.profile?.customCats ?? []), newCat] });
      await patchDoc("items", id, { ...patch, uncertain: [], status: "ready" }); toast("Gespeichert."); return true;
    } catch (e) { fail(e); return false; }
  };
  const archiveItem = async (i: Item) => {
    try { await patchDoc("items", i.id, { archived: !i.archived }); toast(i.archived ? "Wiederhergestellt." : "Archiviert. Wird nicht mehr vorgeschlagen.", { label: "Rückgängig", run: () => void patchDoc("items", i.id, { archived: !!i.archived }) }); } catch (e) { fail(e); }
  };
  const deleteItem = async (i: Item) => {
    try { await delDoc("items", i.id); for (const b of new Set([i.imageId, i.origId, i.cutId].filter(Boolean) as string[])) void store!.removeBlob(b).catch(() => {}); toast("Gelöscht."); } catch (e) { fail(e); }
  };
  const saveItemImage = (i: Item, which: "cut" | "orig") => patchDoc("items", i.id, { imageId: which === "cut" ? i.cutId! : i.origId! }).catch(fail);
  const reanalyze = async (i: Item) => {
    setBusyKey("re-" + i.id, true);
    try { const a = Z.ItemAnalysis.parse(await ai.json(P.analyzeItemPrompt(allCats()), [await blobOf(i.origId || i.imageId)])); if (a.error) throw new AppError("image_rejected"); await patchDoc("items", i.id, itemFromAI(a)); toast("Neu erkannt. Bitte kurz prüfen."); }
    catch (e) { fail(e); } finally { setBusyKey("re-" + i.id, false); }
  };

  const reanalyzeMissing = async () => {
    const todo = live.current.items.filter((i) => i.status === "manual" && i.imageId && !i.archived);
    setBusyKey("reall", { done: 0, total: todo.length }); let ok = 0, done = 0, limited = 0;
    for (const i of todo) {
      try { const a = Z.ItemAnalysis.parse(await ai.json(P.analyzeItemPrompt(allCats()), [await blobOf(i.origId || i.imageId)])); if (!a.error) { await patchDoc("items", i.id, itemFromAI(a)); ok++; } }
      catch (e) {
        const c = (e as AppError).code; if (c === "no_ai" || c === "daily_limit") { fail(e); break; }
        if (c === "rate_limited" && ++limited >= 2) { toast("Das KI-Limit ist gerade erreicht. Versuch es in ein, zwei Minuten noch einmal."); break; }
      }
      setBusyKey("reall", { done: ++done, total: todo.length });
    }
    setBusyKey("reall", null); toast(`${ok} von ${todo.length} Teilen erkannt.${ok < todo.length ? " Der Rest lässt sich einzeln oder später erneut versuchen." : ""}`);
  };

  /* ---------- Inspiration ---------- */
  const uploadInspo = async (files: File[]) => {
    files = files.slice(0, 12); setBusyKey("upload", { done: 0, total: files.length, kind: "inspo" }); let done = 0;
    for (const f of files) {
      let blobId: string | null = null;
      try {
        const img = await prepImage(f, 1600); blobId = await store!.putBlob(img); const id = uid();
        await putDoc("inspo", { id, imageId: blobId, status: "pending", createdAt: Date.now(), fav: false, comment: "", tags: [] });
        try { const a = Z.InspoAnalysisSchema.parse(await ai.json(P.analyzeInspoPrompt(), [img])); await patchDoc("inspo", id, { status: "ready", analysis: { ...a, palette: a.palette.filter((c) => isHex(c.hex)) }, tags: a.error ? [] : a.tags.slice(0, 6) }); }
        catch (e) { await patchDoc("inspo", id, { status: "ready", analysis: { error: "Analyse fehlgeschlagen. Lösche das Bild und versuch es erneut." } }); fail(e); }
      } catch (e) { if (blobId) await store!.removeBlob(blobId).catch(() => {}); fail(e); }
      setBusyKey("upload", { done: ++done, total: files.length, kind: "inspo" });
    }
    setBusyKey("upload", null);
  };
  const deleteInspo = async (x: Inspo) => { try { await delDoc("inspo", x.id); if (x.imageId) void store!.removeBlob(x.imageId).catch(() => {}); toast("Gelöscht."); } catch (e) { fail(e); } };
  const findPatterns = async () => {
    setBusyKey("pat", true);
    try { const r = Z.PatternsResponse.parse(await ai.json(P.patternsPrompt(live.current.inspo))); await patchProfile({ inspoSummary: r.recurring.slice(0, 7) }); toast("Muster gespeichert. Sie fließen in deine Outfits ein."); }
    catch (e) { fail(e); } finally { setBusyKey("pat", false); }
  };

  /* ---------- Reisen ---------- */
  const createTrip = async (x: P.TripReq): Promise<Trip | null> => {
    try {
      const r = Z.TripResponse.parse(await ai.json(P.tripPrompt(ctx(), x)));
      const byId = new Map(live.current.items.map((i) => [i.id, i])); const ok = (id: string) => { const i = byId.get(id); return !!i && !i.archived; };
      const cap = [...new Set(r.itemIds)].filter(ok);
      const plan = r.days.slice(0, x.days).map((d, k) => { const ids = [...new Set(d.itemIds)].filter(ok); ids.forEach((id) => { if (!cap.includes(id)) cap.push(id); }); return { label: d.label || `Tag ${k + 1}`, itemIds: ids, note: d.note }; }).filter((d) => d.itemIds.length >= 2);
      if (cap.length < 2) { toast("Ich konnte aus deinem Schrank keinen sinnvollen Koffer packen."); return null; }
      const t: Trip = { id: uid(), title: (r.title || x.dest).slice(0, 60), dest: x.dest, days: x.days, weather: x.wx, plans: x.plans, bag: x.bag, itemIds: cap, plan, tips: r.tips, missing: r.missing.slice(0, 5), packed: {}, createdAt: Date.now() };
      await putDoc("trips", t); return t;
    } catch (e) { fail(e); return null; }
  };
  const packTrip = (t: Trip, itemId: string) => patchDoc("trips", t.id, { packed: { ...t.packed, [itemId]: !t.packed[itemId] } }).catch(fail);
  const deleteTrip = async (t: Trip) => { try { await delDoc("trips", t.id); toast("Reise gelöscht."); } catch (e) { fail(e); } };

  /* ---------- Daten ---------- */
  const exportAll = () => JSON.stringify({ exportiert: new Date().toISOString(), version: 2, profil: live.current.profile, kleidung: items, inspirationen: inspo, outfits, reisen: trips, getragen: wear }, null, 2);
  const importOld = async (json: string) => {
    try {
      const d = parseOldExport(json); await store!.setProfile(d.profile); setProfile(d.profile);
      for (const i of d.items) await putDoc("items", i); for (const x of d.inspo) await putDoc("inspo", x);
      for (const o of d.outfits) { saved.current.add(o.id); await putDoc("outfits", o); } for (const t of d.trips) await putDoc("trips", t); for (const w of d.wear) await putDoc("wear", w);
      toast(`Importiert: ${d.items.length} Teile, ${d.outfits.length} Outfits. Die alten Fotos müssen neu hochgeladen werden.`);
    } catch (e) { toast((e as Error).message || errText(e)); }
  };
  const wipeAll = async () => {
    try {
      await store!.wipe(); saved.current.clear();
      setProfile(null); setItems([]); setInspo([]); setOutfits([]); setTrips([]); setWear([]); setResults(noResults); toast("Alle Daten gelöscht.");
    } catch (e) { fail(e); }
  };
  const setWx = (w: typeof wx) => { setWxState(w); saveWx(w); };
  const setKey = (k: KeyConfig | null) => { saveKey(k); setKeyCfg(k); };
  const signOut = () => supabase().auth.signOut();

  return {
    phase, store, profile, items, inspo, outfits, trips, wear, results, busy, toasts, wx, keyCfg, aiReady, usable: usable(items), allCats,
    toast, fail, setWx, setKey, signOut, patchProfile, finishOnboarding, stylePhotos, learn,
    outfitById, toggleFav, setRating, setReason, setItemFeedback, toggleWorn, generate, adjust, setResults, outfitIssues: (o: Outfit) => outfitIssues(o.itemIds, items),
    uploadItems, recut, recutAll, saveItemImage, reanalyzeMissing, saveItem, archiveItem, deleteItem, reanalyze, uploadInspo, deleteInspo, patchInspo: (id: string, p: Partial<Inspo>) => patchDoc("inspo", id, p).catch(fail), findPatterns,
    createTrip, packTrip, deleteTrip, exportAll, importOld, wipeAll,
  };
}

const Ctx = createContext<ReturnType<typeof useAppState> | null>(null);
export function AppProvider({ children }: { children: ReactNode }) { const v = useAppState(); return <Ctx.Provider value={v}>{children}</Ctx.Provider>; }
export const useApp = () => { const c = useContext(Ctx); if (!c) throw new Error("AppProvider fehlt"); return c; };
