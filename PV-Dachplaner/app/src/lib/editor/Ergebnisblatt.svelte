<script lang="ts">
  import type { EditorZustand } from "./zustand.svelte";
  import { zahl } from "../berechnung";
  import { MODULE, WECHSELRICHTER, modulPerId, wechselrichterPerId, stringGrenzen, wechselrichterPruefung } from "../geraete";
  import { stringFarbe, stringZusammenfassung, teiler, versuchLaenge, pruefePlan, zweiGruppen, modulAlternativen, gruppenText, type StringGruppe } from "../strings";

  let { z, kompakt = false }: { z: EditorZustand; kompakt?: boolean } = $props();
  let offen = $state(false);
  const g = $derived(z.ergebnis);
  const rand = $derived(z.projekt.settings.randabstandM);
  const ori = $derived(z.projekt.settings.orientation);
  const bereich = $derived(z.projekt.settings.stringBereich);
  const vs = $derived(z.verstringung);
  const modulId = $derived(z.projekt.settings.modulId ?? "");
  const wrId = $derived(z.projekt.settings.wechselrichterId ?? "");
  const grenzen = $derived.by(() => {
    const m = modulPerId(modulId);
    const w = wechselrichterPerId(wrId);
    return m && w ? stringGrenzen(m, w) : null;
  });
  const wrCheck = $derived.by(() => {
    const m = modulPerId(modulId);
    const w = wechselrichterPerId(wrId);
    return m && w && vs ? wechselrichterPruefung(vs.strings, m, w) : { fehler: [] as string[], hinweise: [] as string[] };
  });
  function geraetWahl(art: "modul" | "wr", e: Event) {
    const v = (e.target as HTMLSelectElement).value || null;
    z.setzeGeraete(art === "modul" ? v : (z.projekt.settings.modulId ?? null), art === "wr" ? v : (z.projekt.settings.wechselrichterId ?? null));
  }
  let meldung = $state<Record<string, string>>({});
  function dachGruppen(id: string): StringGruppe[] | null {
    return z.projekt.roofs.find((r) => r.id === id)?.stringGruppen ?? null;
  }
  function stringEingabe(id: string, n: number, e: Event) {
    const el = e.target as HTMLInputElement;
    const t = el.value.trim();
    if (t === "") {
      z.setzeStringGruppen(id, null);
      meldung[id] = "";
      return;
    }
    const v = versuchLaenge(n, Number(t), bereich);
    if (v.ok) {
      z.setzeStringGruppen(id, v.gruppen!);
      meldung[id] = "";
    } else {
      meldung[id] = v.meldung;
      const alt = dachGruppen(id);
      el.value = alt && alt.length === 1 ? String(alt[0]!.laenge) : "";
    }
  }
  function bereichEingabe(art: "min" | "max", e: Event) {
    const t = (e.target as HTMLInputElement).value.trim();
    const alt = bereich ?? { min: 1, max: 60 };
    if (t === "" && art === "min") return z.setzeStringBereich(null);
    const n = Number(t);
    z.setzeStringBereich({ ...alt, [art]: n });
  }
</script>

<section class="erg" aria-label="Ergebnis">
  <button class="kopf" onclick={() => (offen = !offen)} aria-expanded={offen} data-testid="details-umschalten">
    <span class="gross" data-testid="gesamt">
      <strong data-testid="gesamt-module">{g?.module ?? 0}</strong> Module · <strong data-testid="gesamt-kwp">{zahl(g?.kWp ?? 0, 2)}</strong> kWp
    </span>
    <span class="pfeil">{offen ? "▾" : "▸"}</span>
  </button>
  {#if g && g.unvollstaendig > 0}
    <p class="fehlt" data-testid="unvollstaendig">{g.unvollstaendig} Dachfläche{g.unvollstaendig === 1 ? "" : "n"} ohne vollständige Angaben (Neigung, Fallrichtung)</p>
  {/if}
  {#if offen && g && !kompakt}
    <div class="details">
      {#each g.daecher as d (d.id)}
        <div class="dach" data-testid="ergebnis-{d.name}">
          <strong>{d.name}</strong>
          {#if d.layout}
            <span>{zahl(d.layout.grossAreaM2)} m² Dachfläche, {zahl(d.layout.usableAreaM2)} m² nutzbar</span>
            {#if d.layout.obstacleLossM2 > 0.005}
              <span data-testid="hindernis-verlust-{d.name}">Hindernisse −{zahl(d.layout.obstacleLossM2)} m²</span>
            {/if}
            <span>
              {d.layout.moduleCount} Module {d.layout.orientation}
              <span class="mut">(hochkant {d.hochkant}, quer {d.quer})</span>
            </span>
          {:else}
            <span class="fehlt">{d.hinweise.join(", ")}</span>
          {/if}
          {#each d.layout ? d.hinweise : [] as h}<span class="fehlt">{h}</span>{/each}
        </div>
      {/each}
      <div class="einst">
        <span class="etikett">Randabstand</span>
        <div class="seg">
          <button class:an={rand === 0} onclick={() => z.setzeRandabstand(0)} data-testid="rand-0">aus</button>
          <button class:an={rand === 0.2} onclick={() => z.setzeRandabstand(0.2)} data-testid="rand-0.2">20 cm</button>
          <button class:an={rand === 0.1} onclick={() => z.setzeRandabstand(0.1)} data-testid="rand-0.1">10 cm knapp</button>
        </div>
        <span class="etikett">Ausrichtung der Module</span>
        <div class="seg">
          <button class:an={ori === "hochkant"} onclick={() => z.setzeAusrichtungsModus("hochkant")} data-testid="ausrichtung-hochkant">hochkant</button>
          <button class:an={ori === "quer"} onclick={() => z.setzeAusrichtungsModus("quer")} data-testid="ausrichtung-quer">quer</button>
          <button class:an={ori === "beste"} onclick={() => z.setzeAusrichtungsModus("beste")} data-testid="ausrichtung-beste">beste</button>
        </div>
        <span class="etikett">Modul und Wechselrichter (für die zulässige Stringlänge)</span>
        <div class="seg">
          <select value={modulId} onchange={(e) => geraetWahl("modul", e)} aria-label="Modul" data-testid="geraet-modul">
            <option value="">Modul wählen …</option>
            {#each MODULE as m}<option value={m.id}>{m.name}</option>{/each}
          </select>
          <select value={wrId} onchange={(e) => geraetWahl("wr", e)} aria-label="Wechselrichter" data-testid="geraet-wr">
            <option value="">Wechselrichter wählen …</option>
            {#each WECHSELRICHTER as w}<option value={w.id}>{w.name}</option>{/each}
          </select>
        </div>
        {#if grenzen}
          <div class="vdach" data-testid="grenzen">
            {#if grenzen.bereich}<strong>{grenzen.bereich.min} bis {grenzen.bereich.max} Module je String</strong>{/if}
            {#each grenzen.fehler as t}<p class="fehlt">{t}</p>{/each}
            {#each grenzen.warnungen as t}<p class="mut">⚠ {t}</p>{/each}
            <details><summary class="mut">Rechenweg (−10 °C / +70 °C)</summary>{#each grenzen.zeilen as t}<p class="mut">{t}</p>{/each}</details>
          </div>
        {/if}
        <span class="etikett">Zulässige Stringlänge (Module je String, aus Modul- und Wechselrichterdaten; leer = ungeprüft)</span>
        <div class="seg">
          <input type="text" inputmode="numeric" placeholder="min" value={bereich?.min ?? ""} onchange={(e) => bereichEingabe("min", e)} aria-label="Kleinste Stringlänge" data-testid="string-min" />
          <input type="text" inputmode="numeric" placeholder="max" value={bereich?.max ?? ""} onchange={(e) => bereichEingabe("max", e)} aria-label="Größte Stringlänge" data-testid="string-max" />
        </div>
        <span class="etikett">Verstringung je Dachfläche (alle Strings einer Gruppe gleich lang)</span>
        {#each g.daecher.filter((d) => d.layout && d.layout.moduleCount > 0) as d (d.id)}
          {@const n = d.layout!.moduleCount}
          {@const handPlan = z.projekt.roofs.find((r) => r.id === d.id)?.stringManuell ?? null}
          {@const handInfo = vs?.daecher.find((x) => x.roofId === d.id)}
          {@const gr = handPlan ? null : dachGruppen(d.id)}
          {@const tl = teiler(n, bereich)}
          {@const pr = gr ? pruefePlan(n, gr, bereich) : null}
          <div class="vdach" data-testid="verstringung-{d.name}">
            {#if handPlan}
              <div class="zeile">
                <strong>{d.name}</strong>
                <span class="mut">{n} Module · Strings von Hand: {handInfo ? gruppenText(handInfo.gruppen) || "noch keine" : "noch keine"}{handInfo?.ok ? " ✓" : ""}</span>
                <button onclick={() => z.stringeAutomatisch(d.id)} data-testid="hand-aus-{d.name}">automatisch</button>
              </div>
              {#each handInfo?.meldungen ?? [] as t}<p class="fehlt">{t}</p>{/each}
            {:else}
            <div class="zeile">
              <strong>{d.name}</strong>
              <span class="mut">{n} Module</span>
              <input type="text" inputmode="numeric" placeholder="Module je String" value={gr && gr.length === 1 ? gr[0]!.laenge : ""} onchange={(e) => stringEingabe(d.id, n, e)} aria-label="Module je String für {d.name}" data-testid="string-laenge-{d.name}" />
              {#if gr && !handPlan}<button onclick={() => z.setzeStringGruppen(d.id, null)} data-testid="string-aus-{d.name}">aus</button>{/if}
            </div>
            {#if meldung[d.id]}<p class="fehlt" role="alert" data-testid="string-meldung-{d.name}">{meldung[d.id]}</p>{/if}
            {#if gr}
              <p class={pr?.ok ? "mut" : "fehlt"} data-testid="string-gruppen-{d.name}">{gruppenText(gr)}{pr?.ok ? " ✓" : ""}</p>
              {#each pr?.meldungen ?? [] as m}<p class="fehlt">{m}</p>{/each}
            {/if}
            <div class="chips" data-testid="string-teiler-{d.name}">
              {#if tl.length > 0}
                <span class="mut">Passende Längen:</span>
                {#each tl as l}<button class="kl" class:an={gr?.length === 1 && gr[0]!.laenge === l} onclick={() => { z.setzeStringGruppen(d.id, [{ laenge: l, anzahl: n / l }]); meldung[d.id] = ""; }}>{l} × {n / l}</button>{/each}
              {:else}
                <span class="fehlt">Mit {n} Modulen sind keine gleich langen Strings{bereich ? ` von ${bereich.min} bis ${bereich.max} Modulen` : ""} möglich.</span>
              {/if}
            </div>
            {#if tl.length === 0 && bereich}
              {@const zg = zweiGruppen(n, bereich)}
              {#if zg.length > 0}
                <div class="chips">
                  <span class="mut">Zwei Gruppen (z. B. zwei MPPT-Eingänge):</span>
                  {#each zg as x}<button class="kl" onclick={() => { z.setzeStringGruppen(d.id, x); meldung[d.id] = ""; }}>{gruppenText(x)}</button>{/each}
                </div>
              {/if}
              {@const ma = modulAlternativen(n, bereich)}
              {#if ma.length > 0}
                <p class="mut">Oder die Modulzahl ändern: {ma.map((x) => `${x.module} Module (${x.anzahl} × ${x.laenge})`).join(", ")}.</p>
              {/if}
            {/if}
            {/if}
          </div>
        {/each}
        {#each vs?.mpptMeldungen ?? [] as t}<p class="fehlt" data-testid="mppt-meldung">{t}</p>{/each}
        {#each wrCheck.fehler as t}<p class="fehlt" data-testid="wr-fehler">{t}</p>{/each}
        {#each wrCheck.hinweise as t}<p class="mut">⚠ {t}</p>{/each}
        {#if vs && vs.strings.length > 0}
          <p class="mut" data-testid="string-info">{stringZusammenfassung(vs)}</p>
          <div class="strings" data-testid="string-liste">
            {#each vs.strings as st (st.nr)}
              <span class="chip"><i style="background:{stringFarbe(st.nr)}"></i>S{st.nr} · {st.roofName} · {st.module.length}</span>
            {/each}
          </div>
        {/if}
        <p class="mut">Modul 1,15 × 1,78 m, 460 Wp. Gesamt: {zahl(g.schraegflaecheM2)} m² Dachfläche, {zahl(g.nutzbarM2)} m² nutzbar.</p>
      </div>
    </div>
  {/if}
</section>

<style>
  .erg { display: grid; gap: 6px; border-top: 1px solid var(--line); padding-top: 8px; }
  .kopf { display: flex; justify-content: space-between; align-items: center; text-align: left; border: none; padding: 0 4px; min-height: 40px; }
  .gross { font-size: 18px; }
  .pfeil { color: var(--muted); }
  .fehlt { color: var(--bad); font-size: 14px; margin: 0; }
  .details { display: grid; gap: 10px; }
  .dach { display: grid; gap: 2px; font-size: 14px; background: var(--panel); border-radius: 10px; padding: 8px 10px; }
  .mut { color: var(--muted); font-size: 13px; margin: 0; }
  .etikett { font-size: 13px; color: var(--muted); }
  .einst { display: grid; gap: 6px; }
  .einst input { font: inherit; width: 90px; min-height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
  .strings { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; background: var(--panel); border-radius: 8px; padding: 4px 8px; }
  .chip i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 1px solid rgba(0,0,0,.4); }
  select { font: inherit; min-height: 40px; flex: 1 1 140px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); padding: 0 8px; }
  .vdach { display: grid; gap: 4px; background: var(--panel); border-radius: 10px; padding: 8px 10px; }
  .zeile { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .zeile input { width: 130px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .kl { min-height: 34px; padding: 0 10px; }
  .fehlt { overflow-wrap: anywhere; }
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg button { flex: 1 1 auto; min-height: 40px; padding: 0 10px; }
  button.an { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--bg)); }
</style>
