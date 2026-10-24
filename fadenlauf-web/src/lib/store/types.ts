import type { Col, Collections, Profile } from "../types";

/** Persistenz-Schnittstelle. Zwei Implementierungen: lokal (IndexedDB) und Supabase. */
export interface Store {
  readonly kind: "local" | "cloud";
  getProfile(): Promise<Profile | null>;
  /** Ersetzt das Profil komplett. */
  setProfile(p: Profile): Promise<void>;
  /** Führt Felder atomar auf oberster Ebene zusammen (ein Schreibvorgang, kein „null, dann setzen“). */
  patchProfile(patch: Partial<Profile>): Promise<void>;
  list<C extends Col>(col: C): Promise<Collections[C][]>;
  put<C extends Col>(col: C, doc: Collections[C]): Promise<void>;
  patch<C extends Col>(col: C, id: string, patch: Partial<Collections[C]>): Promise<void>;
  remove(col: Col, id: string): Promise<void>;
  putBlob(blob: Blob): Promise<string>;
  blobUrl(id: string): Promise<string>;
  removeBlob(id: string): Promise<void>;
  /** Löscht ALLE Daten und Bilder dieser Person, auch Einträge, die nie geladen wurden. */
  wipe(): Promise<void>;
}
