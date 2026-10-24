import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Col, Collections, Profile } from "../types";
import { uid } from "../util";
import { AppError } from "../errors";
import type { Store } from "./types";

export const supabaseConfigured = () => !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
let client: SupabaseClient | null = null;
export const supabase = () => (client ??= createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY));

const BUCKET = "images";
const PAGE = 1000;
const fail = (e: { message?: string; code?: string } | null): never => {
  if (e?.message && /fetch|network/i.test(e.message)) throw new AppError("offline");
  throw new AppError("db", e?.message);
};

export class SupabaseStore implements Store {
  readonly kind = "cloud" as const;
  private signed = new Map<string, { url: string; exp: number }>();
  constructor(private userId: string) {}

  async getProfile() {
    const { data, error } = await supabase().from("docs").select("data").eq("col", "profile").eq("id", "me").maybeSingle();
    if (error) fail(error);
    return (data?.data as Profile) ?? null;
  }
  async setProfile(p: Profile) {
    const { error } = await supabase().from("docs").upsert({ user_id: this.userId, col: "profile", id: "me", data: p });
    if (error) fail(error);
  }
  async patchProfile(patch: Partial<Profile>) { await this.patch("profile" as never, "me", patch as never); }

  async list<C extends Col>(col: C) {
    // Seitenweise laden: kein stilles Limit mehr (alter Fehler: nur 300 Outfits).
    const out: Collections[C][] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase().from("docs").select("data").eq("col", col).order("created_at", { ascending: false }).range(from, from + PAGE - 1);
      if (error) fail(error);
      out.push(...(data ?? []).map((r) => r.data as Collections[C]));
      if (!data || data.length < PAGE) break;
    }
    return out;
  }
  async put<C extends Col>(col: C, doc: Collections[C]) {
    const { error } = await supabase().from("docs").upsert({ user_id: this.userId, col, id: (doc as any).id, data: doc });
    if (error) fail(error);
  }
  async patch<C extends Col>(col: C, id: string, patch: Partial<Collections[C]>) {
    const { error } = await supabase().rpc("patch_doc", { p_col: col, p_id: id, p_patch: patch });
    if (error) fail(error);
  }
  async remove(col: Col, id: string) {
    const { error } = await supabase().from("docs").delete().eq("col", col).eq("id", id);
    if (error) fail(error);
  }

  async putBlob(blob: Blob) {
    const ext = blob.type.includes("webp") ? "webp" : blob.type.includes("png") ? "png" : "jpg";
    const path = `${this.userId}/${uid()}.${ext}`;
    const { error } = await supabase().storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
    if (error) fail(error);
    return path;
  }
  async blobUrl(id: string) {
    const hit = this.signed.get(id);
    if (hit && hit.exp > Date.now()) return hit.url;
    const { data, error } = await supabase().storage.from(BUCKET).createSignedUrl(id, 3600);
    if (error || !data) return fail(error ?? { message: "no url" });
    this.signed.set(id, { url: data.signedUrl, exp: Date.now() + 50 * 60_000 });
    return data.signedUrl;
  }
  async removeBlob(id: string) { this.signed.delete(id); await supabase().storage.from(BUCKET).remove([id]); }

  async wipe() {
    for (;;) {
      const { data } = await supabase().storage.from(BUCKET).list(this.userId, { limit: 100 });
      if (!data?.length) break;
      await supabase().storage.from(BUCKET).remove(data.map((f) => `${this.userId}/${f.name}`));
    }
    const { error } = await supabase().rpc("wipe_me");
    if (error) fail(error);
    this.signed.clear();
  }
}
