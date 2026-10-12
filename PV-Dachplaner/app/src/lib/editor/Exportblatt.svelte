<script lang="ts">
  import type { EditorZustand } from "./zustand.svelte";
  import type { Project } from "../model";
  import { zahl } from "../berechnung";
  import { erzeugePaket, erzeugePdf, kontextAus } from "../export/erzeugen";
  import { daecherCsv, kurztext, projektCsv, projektJson } from "../export/crm";
  import { kannTeilen, speichereDatei, teileDatei } from "../export/laden";
  import { dateiname } from "../export/pdf";

  let { z, schliessen }: { z: EditorZustand; schliessen: () => void } = $props();

  const p = $derived(z.projekt);
  const g = $derived(z.ergebnis);
  let status = $state("");
  let fehler = $state("");
  let laeuft = $state(false);
  let teilenMoeglich = $state(false);

  // Bearbeiter aus dem letzten Projekt vorbelegen
  $effect(() => {
    if (p.bearbeiter === "") {
      try {
        const b = localStorage.getItem("pv-bearbeiter");
        if (b) z.setzeProjektdaten({ bearbeiter: b });
      } catch {
        /* ohne Speicher weiter */
      }
    }
    teilenMoeglich = kannTeilen("x.pdf", "application/pdf");
  });

  function eingabe(feld: "name" | "kundeName" | "adresseText" | "notiz" | "bearbeiter", e: Event) {
    const wert = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    z.setzeProjektdaten({ [feld]: wert });
    if (feld === "bearbeiter") {
      try {
        localStorage.setItem("pv-bearbeiter", wert);
      } catch {
        /* ohne Speicher weiter */
      }
    }
  }

  const snapshot = () => $state.snapshot(z.projekt) as Project;

  async function ausfuehren(arbeit: () => Promise<void>) {
    if (laeuft) return;
    laeuft = true;
    fehler = "";
    try {
      await arbeit();
    } catch (e) {
      fehler = `Das hat nicht geklappt: ${(e as Error).message}`;
      status = "";
    } finally {
      laeuft = false;
    }
  }

  const pdfSpeichern = () =>
    ausfuehren(async () => {
      const e = await erzeugePdf(snapshot(), (t) => (status = t));
      speichereDatei(e.pdfName, e.pdf as BlobPart, "application/pdf");
      status = `PDF erstellt (${(e.pdf.length / 1024).toFixed(0)} kB)${e.bildOk ? "" : ". Das Luftbild konnte nicht geladen werden, das PDF enthält dafür einen Hinweis."}`;
    });

  const pdfTeilen = () =>
    ausfuehren(async () => {
      const e = await erzeugePdf(snapshot(), (t) => (status = t));
      const ok = await teileDatei(e.pdfName, e.pdf, "application/pdf");
      if (!ok) speichereDatei(e.pdfName, e.pdf as BlobPart, "application/pdf");
      status = "PDF bereit.";
    });

  const paket = () =>
    ausfuehren(async () => {
      const e = await erzeugePaket(snapshot(), (t) => (status = t));
      speichereDatei(e.zipName, e.zip as BlobPart, "application/zip");
      status = `Paket erstellt (${(e.zip.length / 1024).toFixed(0)} kB): PDF, JSON und CSV.`;
    });

  const json = () =>
    ausfuehren(async () => {
      const k = kontextAus(snapshot());
      speichereDatei(dateiname(k.projekt, k.erstelltAm).replace(/\.pdf$/, ".json"), projektJson(k), "application/json");
      status = "JSON gespeichert.";
    });

  const csvDateien = () =>
    ausfuehren(async () => {
      const k = kontextAus(snapshot());
      const stamm = dateiname(k.projekt, k.erstelltAm).replace(/\.pdf$/, "");
      speichereDatei(`${stamm}_projekt.csv`, projektCsv(k), "text/csv;charset=utf-8");
      speichereDatei(`${stamm}_daecher.csv`, daecherCsv(k), "text/csv;charset=utf-8");
      status = "CSV gespeichert (Projekt und Dachflächen).";
    });

  const kopieren = () =>
    ausfuehren(async () => {
      const t = kurztext(kontextAus(snapshot()));
      await navigator.clipboard.writeText(t);
      status = "Kurztext kopiert.";
    });

  const bereit = $derived(p.roofs.length > 0);
</script>

<div class="blatt" role="dialog" aria-modal="true" aria-label="Export">
  <header>
    <h2>Abschließen und exportieren</h2>
    <button onclick={schliessen} aria-label="Schließen" data-testid="export-schliessen">✕</button>
  </header>

  <section>
    <h3>Projektdaten</h3>
    <label>Projektname<input type="text" value={p.name} onchange={(e) => eingabe("name", e)} data-testid="pd-name" /></label>
    <label>Kunde<input type="text" value={p.kunde.name} onchange={(e) => eingabe("kundeName", e)} data-testid="pd-kunde" autocomplete="off" /></label>
    <label>Adresse<input type="text" value={p.adresse.text} onchange={(e) => eingabe("adresseText", e)} data-testid="pd-adresse" autocomplete="off" /></label>
    <label>Bearbeiter<input type="text" value={p.bearbeiter} onchange={(e) => eingabe("bearbeiter", e)} data-testid="pd-bearbeiter" autocomplete="off" /></label>
    <label>Notiz<textarea rows="3" value={p.kunde.notiz} onchange={(e) => eingabe("notiz", e)} data-testid="pd-notiz"></textarea></label>
  </section>

  <section>
    <h3>Ergebnis</h3>
    <p data-testid="export-ergebnis"><strong>{g?.module ?? 0}</strong> Module · <strong>{zahl(g?.kWp ?? 0, 2)}</strong> kWp · {zahl(g?.nutzbarM2 ?? 0)} m² nutzbar</p>
    {#if g && g.unvollstaendig > 0}
      <p class="warn">{g.unvollstaendig} Dachfläche{g.unvollstaendig === 1 ? "" : "n"} ohne Neigung oder Fallrichtung: {g.unvollstaendig === 1 ? "sie ist" : "sie sind"} in den Summen nicht enthalten.</p>
    {/if}
    {#if !bereit}<p class="warn">Zeichne zuerst mindestens eine Dachfläche.</p>{/if}
  </section>

  <section class="knoepfe">
    <button class="primary" disabled={!bereit || laeuft} onclick={pdfSpeichern} data-testid="pdf-erstellen">PDF erstellen</button>
    {#if teilenMoeglich}<button disabled={!bereit || laeuft} onclick={pdfTeilen} data-testid="pdf-teilen">PDF teilen …</button>{/if}
    <h3>Für das CRM</h3>
    <button disabled={!bereit || laeuft} onclick={paket} data-testid="paket-erstellen">Paket (ZIP): PDF, JSON, CSV</button>
    <div class="reihe">
      <button disabled={!bereit || laeuft} onclick={json} data-testid="json-speichern">JSON</button>
      <button disabled={!bereit || laeuft} onclick={csvDateien} data-testid="csv-speichern">CSV</button>
      <button disabled={!bereit || laeuft} onclick={kopieren} data-testid="text-kopieren">Kurztext kopieren</button>
    </div>
  </section>

  {#if status}<p class="status" data-testid="export-status">{status}</p>{/if}
  {#if fehler}<p class="warn" data-testid="export-fehler">{fehler}</p>{/if}
  <p class="mut">PDF und Dateien entstehen auf deinem Gerät. Nichts wird hochgeladen, bis du es selbst versendest.</p>
</div>

<style>
  .blatt { position: fixed; inset: 0; z-index: 30; background: var(--bg); overflow-y: auto; padding: max(12px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)); display: grid; gap: 14px; align-content: start; }
  header { display: flex; justify-content: space-between; align-items: center; }
  h2 { font-size: 20px; margin: 4px 0; }
  h3 { font-size: 15px; margin: 6px 0 2px; }
  section { display: grid; gap: 8px; }
  label { display: grid; gap: 3px; font-size: 13px; color: var(--muted); }
  input, textarea { font: inherit; font-size: 16px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); min-height: 44px; }
  .knoepfe button { width: 100%; }
  .reihe { display: flex; gap: 8px; flex-wrap: wrap; }
  .reihe button { flex: 1 1 auto; }
  button:disabled { opacity: .45; }
  .warn { color: var(--bad); margin: 0; font-size: 14px; }
  .status { color: var(--ok); margin: 0; font-size: 14px; }
  .mut { color: var(--muted); font-size: 13px; margin: 0; }
  p { margin: 0; }
</style>
