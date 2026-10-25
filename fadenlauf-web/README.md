# Fadenlauf Web

Persönlicher KI-Stylist als eigenständige Web-App (React, TypeScript, Tailwind, Vite). Nachfolger des Claude-Artifacts.
Outfits entstehen ausschließlich aus Teilen deines echten Kleiderschranks (`cleanOutfit` verwirft erfundene IDs).

## Zwei Betriebsarten

| | Lokal-Modus (Standard ohne `.env`) | Cloud-Modus (Supabase) |
|---|---|---|
| Daten | IndexedDB im Browser | Postgres + privater Bucket, Row-Level-Security |
| Login | keiner | E-Mail-Link |
| KI | eigener Schlüssel unter Profil → KI | Edge Function, Schlüssel bleibt serverseitig |
| Geräte | eins | synchron, mehrere Nutzer |

## Entwickeln

```bash
npm install
npm run dev      # http://localhost:5173, Lokal-Modus
npm run check    # Tests + Typecheck + Build
```

## Cloud-Modus einrichten (kostenlos)

1. Projekt auf supabase.com anlegen (Free-Tarif).
2. SQL aus `supabase/migrations/0001_init.sql` im SQL-Editor ausführen.
3. Authentication → URL Configuration: Site-URL auf die spätere Netlify-Adresse setzen.
4. KI-Schlüssel holen: kostenlos bei Google AI Studio (Gemini) oder bei Anthropic (kostenpflichtig).
5. Edge Function deployen:
   ```bash
   npx supabase login && npx supabase link --project-ref <ref>
   npx supabase secrets set AI_PROVIDER=gemini GEMINI_API_KEY=... AI_DAILY_LIMIT=150
   npx supabase functions deploy ai
   ```
   Das Gemini-Modell ist über das Secret `AI_MODEL` änderbar (Standard `gemini-3.5-flash`; ältere Namen wie `gemini-2.5-flash` sind für neue Nutzer abgeschaltet).
   Für Claude: `AI_PROVIDER=anthropic ANTHROPIC_API_KEY=...`.
6. `.env` nach `.env.example` anlegen (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) und auf Netlify als Umgebungsvariablen setzen. `netlify.toml` ist vorbereitet.

## Behobene Fehler gegenüber dem Artifact

- Rückgängig gemachtes Einzelteil-Feedback (`0`) wurde der KI als „passt nicht“ gemeldet.
- Statistik und „kürzlich getragen“ zählten nur die neuesten 300 Outfits. Tragen steht jetzt in eigener Sammlung, ohne Limit.
- „Alle Daten löschen“ ließ ältere Outfits zurück. Jetzt löscht eine serverseitige Funktion alles.
- Das Freistell-Banner kam bei fehlgeschlagenen Teilen dauerhaft wieder (`cutTried`).
- Profil-Updates waren zweistufig („null, dann setzen“) und konnten Daten verlieren. Jetzt ein atomarer Merge.
- Feedback-Zähler ging bei schnellen Taps verloren.
- Vorschläge werden erst gespeichert, wenn man damit etwas tut. Abgelehnte Kombinationen werden nicht erneut vorgeschlagen.
- Große Schränke werden vorgefiltert (Saison, jede Rolle bleibt), Nutzertexte sind im Prompt als Daten markiert, Hex-Farben werden geprüft, verwaiste Bilder bei Fehlern aufgeräumt.
- Dialoge nutzen `<dialog>` (Fokusfalle, Escape, Fokus-Rückgabe).

## Import aus dem Artifact

Profil → „Alten Export importieren“. Profil, Teile (ohne Foto), Outfits, Reisen und Tragen-Verlauf werden übernommen.
Die Fotos des Artifacts sind im JSON-Export nicht enthalten und müssen neu hochgeladen werden.
