import { AppError } from "./errors";
import { supabase } from "./store/supabase";

export interface Ai { json(prompt: string, images?: Blob[]): Promise<unknown>; }

/** Toleranter JSON-Parser: entfernt Codezäune und schneidet das äußerste Objekt heraus. */
export function parseJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(t); } catch { /* weiter */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* weiter */ } }
  throw new AppError("invalid_json");
}
const toB64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = () => rej(new AppError("image_rejected")); r.readAsDataURL(b); });

/** Cloud: Aufruf über die Supabase-Edge-Function. Der API-Schlüssel bleibt auf dem Server. */
export class EdgeAi implements Ai {
  async json(prompt: string, images: Blob[] = []) {
    const imgs = await Promise.all(images.map(async (b) => ({ mime: b.type || "image/jpeg", data: await toB64(b) })));
    const { data, error } = await supabase().functions.invoke(import.meta.env.VITE_AI_FUNCTION || "ai", { body: { prompt, images: imgs } });
    if (error) {
      const body = await (error as any).context?.json?.().catch(() => null);
      throw new AppError(body?.code ?? "offline", undefined, body?.detail ?? (body?.message ? String(body.message).slice(0, 160) : String((error as Error).message).slice(0, 120)));
    }
    if (data?.error) throw new AppError(data.error);
    return data.result;
  }
}

export type KeyConfig = { provider: "gemini" | "anthropic"; key: string };
const KEY = "fadenlauf-ai";
export const loadKey = (): KeyConfig | null => { try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); return v?.key ? v : null; } catch { return null; } };
export const saveKey = (k: KeyConfig | null) => { try { k ? localStorage.setItem(KEY, JSON.stringify(k)) : localStorage.removeItem(KEY); } catch { /* privat */ } };

/** Lokal-Modus: Nutzer trägt den eigenen Schlüssel ein, Aufruf direkt aus dem Browser. */
export class DirectAi implements Ai {
  constructor(private cfg: KeyConfig) {}
  async json(prompt: string, images: Blob[] = []) {
    const imgs = await Promise.all(images.map(async (b) => ({ mime: b.type || "image/jpeg", data: await toB64(b) })));
    let res: Response;
    try {
      res = this.cfg.provider === "gemini"
        ? await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, {
            method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": this.cfg.key },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...imgs.map((i) => ({ inline_data: { mime_type: i.mime, data: i.data } }))] }], generationConfig: { responseMimeType: "application/json", temperature: 0.8 } }),
          })
        : await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST", headers: { "content-type": "application/json", "x-api-key": this.cfg.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
            body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 4096, messages: [{ role: "user", content: [...imgs.map((i) => ({ type: "image", source: { type: "base64", media_type: i.mime, data: i.data } })), { type: "text", text: prompt }] }] }),
          });
    } catch { throw new AppError("offline"); }
    if (res.status === 429) throw new AppError("rate_limited");
    if (res.status === 401 || res.status === 403 || res.status === 400) throw new AppError("not_granted");
    if (!res.ok) throw new AppError("offline");
    const j = await res.json();
    const text = this.cfg.provider === "gemini" ? j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") : j?.content?.map((p: any) => p.text).join("");
    if (!text) throw new AppError("refused");
    return parseJson(text);
  }
}
export const noAi: Ai = { json: async () => { throw new AppError("no_ai"); } };
