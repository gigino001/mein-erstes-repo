// Supabase Edge Function (Deno): reicht Prompts an Gemini (kostenloses Kontingent) oder Claude weiter.
// Secrets: AI_PROVIDER=gemini|anthropic, GEMINI_API_KEY oder ANTHROPIC_API_KEY, optional AI_MODEL, AI_DAILY_LIMIT.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization, x-client-info, apikey, content-type" };
const fail = async (r: Response, code: string, status: number) => {
  const t = (await r.text().catch(() => "")).slice(0, 300);
  console.error("Anbieter-Fehler", r.status, t);
  let msg = t; try { msg = JSON.parse(t)?.error?.message ?? t; } catch { /* Rohtext */ }
  return reply({ code, detail: `${r.status}: ${String(msg).slice(0, 160)}` }, status);
};
/** Wiederholt kurz bei Überlastung (503), damit Lastspitzen den Nutzer nicht stören. */
async function post(url: string, init: RequestInit) {
  let r = await fetch(url, init);
  for (let i = 0; i < 2 && r.status === 503; i++) { await new Promise((ok) => setTimeout(ok, 1500 * (i + 1))); r = await fetch(url, init); }
  return r;
}
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

function parseJson(text: string) {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(t); } catch { /* weiter */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error("invalid_json");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const jwt = req.headers.get("authorization")?.replace(/^Bearer /i, "");
  if (!jwt) return reply({ code: "auth" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: u } = await admin.auth.getUser(jwt);
  if (!u?.user) return reply({ code: "auth" }, 401);

  const { prompt, images = [] } = await req.json().catch(() => ({}));
  if (typeof prompt !== "string" || prompt.length > 120_000 || images.length > 3) return reply({ code: "refused" }, 400);

  // Tageslimit je Nutzer
  const limit = Number(Deno.env.get("AI_DAILY_LIMIT") ?? 150);
  const day = new Date().toISOString().slice(0, 10);
  const { data: row } = await admin.from("ai_usage").select("n").eq("user_id", u.user.id).eq("day", day).maybeSingle();
  if ((row?.n ?? 0) >= limit) return reply({ code: "daily_limit" }, 429);
  await admin.from("ai_usage").upsert({ user_id: u.user.id, day, n: (row?.n ?? 0) + 1 });

  const provider = Deno.env.get("AI_PROVIDER") ?? "gemini";
  try {
    let text = "";
    if (provider === "anthropic") {
      const r = await post("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: Deno.env.get("AI_MODEL") ?? "claude-sonnet-5-5", max_tokens: 4096, messages: [{ role: "user", content: [...images.map((i: any) => ({ type: "image", source: { type: "base64", media_type: i.mime, data: i.data } })), { type: "text", text: prompt }] }] }),
      });
      if (r.status === 429) return fail(r, "rate_limited", 429);
      if (!r.ok) return fail(r, "provider", 502);
      text = (await r.json()).content?.map((p: any) => p.text).join("") ?? "";
    } else {
      const model = Deno.env.get("AI_MODEL") ?? "gemini-3.5-flash";
      const r = await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": Deno.env.get("GEMINI_API_KEY")! },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, ...images.map((i: any) => ({ inline_data: { mime_type: i.mime, data: i.data } }))] }], generationConfig: { responseMimeType: "application/json", temperature: 0.8 } }),
      });
      if (r.status === 429) return fail(r, "rate_limited", 429);
      if (!r.ok) return fail(r, "provider", 502);
      text = (await r.json()).candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
    }
    if (!text) return reply({ code: "refused" }, 422);
    return reply({ result: parseJson(text) });
  } catch (e) {
    console.error("Fehler", e);
    return reply({ code: "invalid_json", detail: String(e).slice(0, 160) }, 422);
  }
});
