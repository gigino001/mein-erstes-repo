import type { Col, Collections, Profile } from "../types";
import { uid } from "../util";
import { AppError } from "../errors";
import type { Store } from "./types";

const DB = "fadenlauf", V = 1;
const open = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open(DB, V);
  r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("docs"); d.createObjectStore("blobs"); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
let dbp: Promise<IDBDatabase> | null = null;
const db = () => (dbp ??= open());
async function tx<T>(store: "docs" | "blobs", mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const d = await db();
  return new Promise<T>((res, rej) => {
    const t = d.transaction(store, mode); const r = fn(t.objectStore(store));
    t.oncomplete = () => res((r ? r.result : undefined) as T);
    t.onerror = () => rej(t.error?.name === "QuotaExceededError" ? new AppError("quota") : t.error);
    t.onabort = () => rej(t.error?.name === "QuotaExceededError" ? new AppError("quota") : t.error);
  });
}
const key = (c: string, id: string) => `${c}/${id}`;

export class LocalStore implements Store {
  readonly kind = "local" as const;
  private urls = new Map<string, string>();

  getProfile() { return tx<Profile | undefined>("docs", "readonly", (s) => s.get(key("profile", "me"))).then((p) => p ?? null); }
  setProfile(p: Profile) { return tx<void>("docs", "readwrite", (s) => s.put(p, key("profile", "me"))); }
  async patchProfile(patch: Partial<Profile>) {
    // Lesen und Schreiben in einer Transaktion, damit nichts dazwischenkommt.
    const d = await db();
    await new Promise<void>((res, rej) => {
      const t = d.transaction("docs", "readwrite"); const s = t.objectStore("docs"); const g = s.get(key("profile", "me"));
      g.onsuccess = () => { if (g.result) s.put({ ...g.result, ...patch }, key("profile", "me")); };
      t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  async list<C extends Col>(col: C) {
    const d = await db();
    return new Promise<Collections[C][]>((res, rej) => {
      const out: Collections[C][] = []; const t = d.transaction("docs", "readonly");
      const r = t.objectStore("docs").openCursor(IDBKeyRange.bound(col + "/", col + "/￿"));
      r.onsuccess = () => { const c = r.result; if (c) { out.push(c.value); c.continue(); } };
      t.oncomplete = () => res(out.sort((a: any, b: any) => (b.createdAt ?? b.date ?? 0) - (a.createdAt ?? a.date ?? 0)));
      t.onerror = () => rej(t.error);
    });
  }
  put<C extends Col>(col: C, doc: Collections[C]) { return tx<void>("docs", "readwrite", (s) => s.put(doc, key(col, (doc as any).id))); }
  async patch<C extends Col>(col: C, id: string, patch: Partial<Collections[C]>) {
    const d = await db();
    await new Promise<void>((res, rej) => {
      const t = d.transaction("docs", "readwrite"); const s = t.objectStore("docs"); const g = s.get(key(col, id));
      g.onsuccess = () => { if (g.result) s.put({ ...g.result, ...patch }, key(col, id)); };
      t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  remove(col: Col, id: string) { return tx<void>("docs", "readwrite", (s) => s.delete(key(col, id))); }

  async putBlob(blob: Blob) { const id = uid(); await tx<void>("blobs", "readwrite", (s) => s.put(blob, id)); return id; }
  async blobUrl(id: string) {
    const hit = this.urls.get(id); if (hit) return hit;
    const b = await tx<Blob | undefined>("blobs", "readonly", (s) => s.get(id));
    if (!b) throw new AppError("image_rejected");
    const u = URL.createObjectURL(b); this.urls.set(id, u); return u;
  }
  async removeBlob(id: string) { const u = this.urls.get(id); if (u) { URL.revokeObjectURL(u); this.urls.delete(id); } await tx<void>("blobs", "readwrite", (s) => s.delete(id)); }
  async wipe() {
    this.urls.forEach((u) => URL.revokeObjectURL(u)); this.urls.clear();
    await tx<void>("docs", "readwrite", (s) => s.clear()); await tx<void>("blobs", "readwrite", (s) => s.clear());
  }
}
