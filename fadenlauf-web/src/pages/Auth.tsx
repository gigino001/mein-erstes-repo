import { useState } from "react";
import { Field } from "../components/ui";
import { supabase } from "../lib/store/supabase";

/** Anmeldung per E-Mail-Link (kein Passwort). Supabase verschickt den Link. */
export function AuthPage() {
  const [email, setEmail] = useState(""); const [sent, setSent] = useState(false); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    const { error } = await supabase().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } });
    setBusy(false); if (error) setErr("Das hat nicht geklappt. Prüfe die E-Mail-Adresse und versuche es erneut."); else setSent(true);
  };
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
      <div className="w-full space-y-8 py-16">
        <div><p className="eyebrow mb-4">Dein KI-Stylist</p><h1 className="italic">Fadenlauf</h1><p className="mt-4 text-muted">Dein echter Kleiderschrank, deine Looks, privat und nur für dich.</p></div>
        {sent ? (
          <p className="note">Wir haben dir einen Link an <b>{email}</b> geschickt. Öffne ihn auf diesem Gerät, dann bist du drin.</p>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <Field label="E-Mail"><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="du@beispiel.de" /></Field>
            {err && <p role="alert" className="text-sm text-bad">{err}</p>}
            <button className="btn w-full" disabled={busy || !email}>{busy ? "Sende …" : "Login-Link senden"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
