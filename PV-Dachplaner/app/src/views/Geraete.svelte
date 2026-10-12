<script lang="ts">
  import { router } from "../lib/router.svelte";
  import { geraete } from "../lib/geraeteStore.svelte";
  import { stringGrenzen, type ModulTyp, type WechselrichterTyp } from "../lib/geraete";

  type Form = { art: "modul"; d: Record<string, string>; id: string } | { art: "wr"; d: Record<string, string>; mppt: { strings: string; maxA: string; iscMaxA: string }[]; id: string };
  let form = $state<Form | null>(null);
  let meldung = $state("");
  let fehler = $state("");

  const zeig = (x: number) => (Number.isFinite(x) ? String(x) : "");
  const num = (s: string) => {
    const t = s.trim().replace(",", ".");
    return t === "" ? NaN : Number(t);
  };

  const MODUL_FELDER: [string, string, string][] = [
    ["pmaxW", "Nennleistung Pmax (W)", "Pflicht"],
    ["vocV", "Leerlaufspannung Voc (V)", ""],
    ["vmppV", "MPP-Spannung Vmpp (V)", ""],
    ["iscA", "Kurzschlussstrom Isc (A)", ""],
    ["imppA", "MPP-Strom Impp (A)", ""],
    ["tkVocProzent", "Temperaturkoeffizient Voc (%/K, negativ)", ""],
    ["tkPmaxProzent", "Temperaturkoeffizient Pmax (%/K, negativ)", ""],
    ["tkIscProzent", "Temperaturkoeffizient Isc (%/K)", ""],
    ["maxSystemV", "Max. Systemspannung (V)", ""],
    ["maxSicherungA", "Max. Reihensicherung (A)", ""],
    ["laengeMm", "Länge (mm)", ""],
    ["breiteMm", "Breite (mm)", ""],
  ];
  const WR_FELDER: [string, string][] = [
    ["acKw", "AC-Leistung (kW)"],
    ["maxDcV", "Max. DC-Eingangsspannung (V)"],
    ["mpptMinV", "MPPT-Spannung von (V)"],
    ["mpptMaxV", "MPPT-Spannung bis (V)"],
    ["startV", "Startspannung (V)"],
  ];

  function neuModul(vorlage?: ModulTyp) {
    const m = vorlage;
    const d: Record<string, string> = { name: m ? `${m.name} (Kopie)` : "", quelle: m?.quelle ?? "" };
    for (const [k] of MODUL_FELDER) d[k] = m ? zeig((m as unknown as Record<string, number>)[k]!) : "";
    form = { art: "modul", id: geraete.neueId(), d };
    fehler = "";
  }
  function bearbeiteModul(m: ModulTyp) {
    neuModul(m);
    if (form) {
      form.id = m.id;
      form.d.name = m.name;
    }
  }
  function neuWr(vorlage?: WechselrichterTyp) {
    const w = vorlage;
    const d: Record<string, string> = { name: w ? `${w.name} (Kopie)` : "", hersteller: w?.hersteller ?? "", quelle: w?.quelle ?? "", hinweis: w?.hinweis ?? "" };
    for (const [k] of WR_FELDER) d[k] = w ? zeig((w as unknown as Record<string, number>)[k]!) : "";
    const mppt = (w?.mppt ?? [{ strings: 1, maxA: NaN, iscMaxA: NaN }, { strings: 1, maxA: NaN, iscMaxA: NaN }]).map((x) => ({ strings: String(x.strings), maxA: zeig(x.maxA), iscMaxA: zeig(x.iscMaxA) }));
    form = { art: "wr", id: geraete.neueId(), d, mppt };
    fehler = "";
  }
  function bearbeiteWr(w: WechselrichterTyp) {
    neuWr(w);
    if (form) {
      form.id = w.id;
      form.d.name = w.name;
    }
  }

  function speichern() {
    if (!form) return;
    const f = form;
    if (!f.d.name?.trim()) return (fehler = "Bitte einen Namen eingeben.");
    if (f.art === "modul") {
      const pmax = num(f.d.pmaxW!);
      if (!(pmax > 0)) return (fehler = "Die Nennleistung Pmax ist ein Pflichtfeld.");
      const g = (k: string) => num(f.d[k]!);
      if (Number.isFinite(g("tkVocProzent")) && g("tkVocProzent") > 0) return (fehler = "Der Temperaturkoeffizient von Voc ist bei Silizium-Modulen negativ (z. B. −0,25).");
      if (Number.isFinite(g("tkPmaxProzent")) && g("tkPmaxProzent") > 0) return (fehler = "Der Temperaturkoeffizient von Pmax ist negativ (z. B. −0,28).");
      geraete.speichereModul({
        id: f.id, name: f.d.name.trim(), pmaxW: pmax, vocV: g("vocV"), vmppV: g("vmppV"), iscA: g("iscA"), imppA: g("imppA"),
        tkVocProzent: g("tkVocProzent"), tkPmaxProzent: g("tkPmaxProzent"), tkIscProzent: g("tkIscProzent"),
        maxSystemV: g("maxSystemV"), maxSicherungA: g("maxSicherungA"), laengeMm: g("laengeMm"), breiteMm: g("breiteMm"),
        quelle: f.d.quelle?.trim() || "eigene Eingabe",
      });
    } else {
      const g = (k: string) => num(f.d[k]!);
      for (const [k, t] of WR_FELDER.slice(1)) if (!(g(k) > 0)) return (fehler = `${t}: Pflichtfeld.`);
      if (g("mpptMinV") >= g("mpptMaxV")) return (fehler = "Die MPPT-Untergrenze muss unter der Obergrenze liegen.");
      if (f.mppt.length < 1) return (fehler = "Mindestens ein MPPT-Eingang.");
      const mppt = f.mppt.map((x) => ({ strings: Math.max(1, Math.floor(num(x.strings)) || 1), maxA: num(x.maxA), iscMaxA: num(x.iscMaxA) }));
      geraete.speichereWr({
        id: f.id, name: f.d.name.trim(), hersteller: f.d.hersteller?.trim() || "eigene Eingabe", acKw: g("acKw"),
        maxDcV: g("maxDcV"), mpptMinV: g("mpptMinV"), mpptMaxV: g("mpptMaxV"), startV: g("startV"), mppt,
        quelle: f.d.quelle?.trim() || "eigene Eingabe", hinweis: f.d.hinweis?.trim() || undefined,
      });
    }
    form = null;
    fehler = "";
    meldung = "Gespeichert.";
  }

  function loeschen(id: string, name: string) {
    if (confirm(`„${name}“ löschen?`)) geraete.loesche(id);
  }
  function sichern() {
    const blob = new Blob([geraete.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pv-geraete-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  async function einlesen(e: Event) {
    const datei = (e.target as HTMLInputElement).files?.[0];
    if (!datei) return;
    try {
      const r = geraete.importJson(await datei.text());
      meldung = `Eingelesen: ${r.module} Module, ${r.wechselrichter} Wechselrichter${r.fehler ? `, ${r.fehler} Einträge übersprungen (ungültig oder keine eigenen)` : ""}.`;
    } catch {
      meldung = "Die Datei konnte nicht gelesen werden.";
    }
    (e.target as HTMLInputElement).value = "";
  }

  /** Vorschau: zulässige Stringlänge der gewählten Kombination */
  let vorMod = $state("");
  let vorWr = $state("");
  const vorschau = $derived.by(() => {
    const m = geraete.modul(vorMod), w = geraete.wr(vorWr);
    return m && w ? stringGrenzen(m, w) : null;
  });
</script>

<main>
  <header>
    <button onclick={() => router.gehe({ name: "liste" })} aria-label="Zurück">‹</button>
    <h1>Geräte</h1>
  </header>
  <p class="muted">Module und Wechselrichter für die Stringlänge. Die Werte mit „Datenblatt“ sind fest eingebaut, eigene Einträge speichert dein Browser und du kannst sie als Datei sichern.</p>

  <div class="reihe">
    <button onclick={sichern} data-testid="geraete-sichern">Eigene Geräte sichern</button>
    <label class="datei">Geräte einlesen<input type="file" accept="application/json,.json" onchange={einlesen} data-testid="geraete-einlesen" /></label>
  </div>
  {#if meldung}<p class="ok" data-testid="geraete-meldung">{meldung}</p>{/if}

  {#if form}
    <section class="form" data-testid="geraete-formular">
      <h2>{form.art === "modul" ? "Modul" : "Wechselrichter"}</h2>
      <label>Name<input bind:value={form.d.name} data-testid="g-name" /></label>
      {#if form.art === "modul"}
        {#each MODUL_FELDER as [k, t, p]}
          <label>{t}{p ? " *" : ""}<input inputmode="decimal" bind:value={form.d[k]} data-testid="g-{k}" /></label>
        {/each}
      {:else}
        <label>Hersteller<input bind:value={form.d.hersteller} /></label>
        {#each WR_FELDER as [k, t]}
          <label>{t}<input inputmode="decimal" bind:value={form.d[k]} data-testid="g-{k}" /></label>
        {/each}
        <h3>MPPT-Eingänge</h3>
        {#each form.mppt as x, i}
          <div class="mppt">
            <strong>MPPT {i + 1}</strong>
            <label>Strings<input inputmode="numeric" bind:value={x.strings} /></label>
            <label>max. Strom (A)<input inputmode="decimal" bind:value={x.maxA} /></label>
            <label>max. Kurzschluss (A)<input inputmode="decimal" bind:value={x.iscMaxA} /></label>
            <button class="gefahr" onclick={() => form?.art === "wr" && form.mppt.splice(i, 1)} aria-label="MPPT {i + 1} entfernen">✕</button>
          </div>
        {/each}
        <button onclick={() => form?.art === "wr" && form.mppt.push({ strings: "1", maxA: "", iscMaxA: "" })}>+ MPPT-Eingang</button>
        <label>Hinweis<input bind:value={form.d.hinweis} /></label>
      {/if}
      <label>Quelle (z. B. Datenblatt, Version)<input bind:value={form.d.quelle} /></label>
      {#if fehler}<p class="fehler" role="alert" data-testid="geraete-fehler">{fehler}</p>{/if}
      <div class="reihe">
        <button class="primary" onclick={speichern} data-testid="g-speichern">Speichern</button>
        <button onclick={() => (form = null)}>Abbrechen</button>
      </div>
    </section>
  {:else}
    <section>
      <div class="kopf"><h2>Module</h2><button onclick={() => neuModul()} data-testid="modul-neu">+ Neu</button></div>
      <ul data-testid="modul-liste">
        {#each geraete.module as m (m.id)}
          <li>
            <div>
              <strong>{m.name}</strong>
              <span class="muted">{geraete.eigen(m.id) ? "eigen" : "Datenblatt"} · Voc {zeig(m.vocV) || "–"} V · Vmpp {zeig(m.vmppV) || "–"} V · Isc {zeig(m.iscA) || "–"} A · Impp {zeig(m.imppA) || "–"} A</span>
              <span class="muted">{m.quelle}</span>
            </div>
            <div class="akt">
              {#if geraete.eigen(m.id)}
                <button onclick={() => bearbeiteModul(m)}>Ändern</button>
                <button class="gefahr" onclick={() => loeschen(m.id, m.name)}>Löschen</button>
              {:else}
                <button onclick={() => neuModul(m)}>Kopieren</button>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </section>
    <section>
      <div class="kopf"><h2>Wechselrichter</h2><button onclick={() => neuWr()} data-testid="wr-neu">+ Neu</button></div>
      <ul data-testid="wr-liste">
        {#each geraete.wechselrichter as w (w.id)}
          <li>
            <div>
              <strong>{w.name}</strong>
              <span class="muted">{geraete.eigen(w.id) ? "eigen" : "Datenblatt"} · {w.mppt.length} MPPT · {w.mpptMinV}–{w.mpptMaxV} V · Start {w.startV} V · max. {w.maxDcV} V</span>
              <span class="muted">{w.quelle}{w.hinweis ? ` – ${w.hinweis}` : ""}</span>
            </div>
            <div class="akt">
              {#if geraete.eigen(w.id)}
                <button onclick={() => bearbeiteWr(w)}>Ändern</button>
                <button class="gefahr" onclick={() => loeschen(w.id, w.name)}>Löschen</button>
              {:else}
                <button onclick={() => neuWr(w)}>Kopieren</button>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </section>
    <section class="form">
      <h2>Stringlänge prüfen</h2>
      <div class="reihe">
        <select bind:value={vorMod} aria-label="Modul"><option value="">Modul …</option>{#each geraete.module as m}<option value={m.id}>{m.name}</option>{/each}</select>
        <select bind:value={vorWr} aria-label="Wechselrichter"><option value="">Wechselrichter …</option>{#each geraete.wechselrichter as w}<option value={w.id}>{w.name}</option>{/each}</select>
      </div>
      {#if vorschau}
        {#if vorschau.bereich}<p><strong>{vorschau.bereich.min} bis {vorschau.bereich.max} Module je String</strong></p>{/if}
        {#each vorschau.fehler as t}<p class="fehler">{t}</p>{/each}
        {#each vorschau.warnungen as t}<p class="muted">⚠ {t}</p>{/each}
        {#each vorschau.zeilen as t}<p class="muted">{t}</p>{/each}
      {/if}
    </section>
  {/if}
</main>

<style>
  main { max-width: 640px; margin: 0 auto; padding: 12px 16px 40px; display: grid; gap: 12px; }
  header { display: flex; align-items: center; gap: 10px; }
  h1 { margin: 0; font-size: 22px; }
  h2 { margin: 0; font-size: 18px; }
  h3 { margin: 6px 0 0; font-size: 15px; }
  p { margin: 0; }
  .muted { color: var(--muted); font-size: 13px; display: block; }
  .ok { color: var(--accent); }
  .fehler { color: var(--bad); }
  .reihe { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .kopf { display: flex; justify-content: space-between; align-items: center; }
  ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 8px; }
  li { display: flex; justify-content: space-between; gap: 8px; align-items: center; background: var(--panel); border-radius: 12px; padding: 10px 12px; }
  li > div:first-child { display: grid; gap: 2px; min-width: 0; }
  .akt { display: flex; gap: 6px; flex-shrink: 0; }
  .form { display: grid; gap: 8px; }
  label { display: grid; gap: 3px; font-size: 13px; color: var(--muted); }
  input, select { font: inherit; min-height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
  .mppt { display: grid; grid-template-columns: auto 1fr 1fr 1fr auto; gap: 6px; align-items: end; }
  .mppt input { min-width: 0; width: 100%; }
  .datei { position: relative; display: inline-flex; align-items: center; min-height: 40px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; color: var(--fg); font-size: 14px; cursor: pointer; }
  .datei input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .gefahr { color: var(--bad); }
  button { min-height: 40px; }
</style>
