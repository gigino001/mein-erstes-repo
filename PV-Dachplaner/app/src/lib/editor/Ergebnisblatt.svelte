<script lang="ts">
  import type { EditorZustand } from "./zustand.svelte";
  import { zahl } from "../berechnung";
  import { stringFarbe, stringZusammenfassung } from "../strings";

  let { z, kompakt = false }: { z: EditorZustand; kompakt?: boolean } = $props();
  let offen = $state(false);
  const g = $derived(z.ergebnis);
  const rand = $derived(z.projekt.settings.randabstandM);
  const ori = $derived(z.projekt.settings.orientation);
  const sl = $derived(z.projekt.settings.stringLaenge);
  const vs = $derived(z.verstringung);
  function stringEingabe(e: Event) {
    const t = (e.target as HTMLInputElement).value.trim();
    z.setzeStringLaenge(t === "" ? null : Number(t));
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
        <span class="etikett">Verstringung (Module je String, höchstens)</span>
        <div class="seg">
          <input type="text" inputmode="numeric" placeholder="aus" value={sl ?? ""} onchange={stringEingabe} aria-label="Module je String, höchstens" data-testid="string-laenge" />
          <button class:an={z.projekt.settings.stringGleichLang} onclick={() => z.setzeStringGleichLang(!z.projekt.settings.stringGleichLang)} aria-pressed={z.projekt.settings.stringGleichLang} data-testid="string-gleich">gleich lange Strings</button>
        </div>
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
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg button { flex: 1 1 auto; min-height: 40px; padding: 0 10px; }
  button.an { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--bg)); }
</style>
