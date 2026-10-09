<script lang="ts">
  import type { EditorZustand } from "./zustand.svelte";
  import { himmelsrichtung } from "../format";

  let { z }: { z: EditorZustand } = $props();
  const dach = $derived(z.gewaehltesDach);
  const NEIGUNGEN = [20, 25, 30, 35, 40, 45];
  const RICHTUNGEN: [string, number][] = [["N", 0], ["NO", 45], ["O", 90], ["SO", 135], ["S", 180], ["SW", 225], ["W", 270], ["NW", 315]];

  function neigungEingabe(e: Event) {
    if (!dach) return;
    const t = (e.target as HTMLInputElement).value.replace(",", ".").trim();
    z.setzeNeigung(dach.id, t === "" ? null : Number(t));
  }
  function richtungEingabe(e: Event) {
    if (!dach) return;
    const t = (e.target as HTMLInputElement).value.replace(",", ".").trim();
    z.setzeAusrichtung(dach.id, t === "" ? null : Number(t));
  }
</script>

{#if dach && z.werkzeug === "auswahl"}
  <section class="eig" aria-label="Eigenschaften von {dach.name}">
    <div class="zeile">
      <span class="etikett">Neigung</span>
      <div class="knoepfe">
        {#each NEIGUNGEN as n}
          <button class:an={dach.slopeDeg === n} onclick={() => z.setzeNeigung(dach.id, n)} data-testid="neigung-{n}">{n}°</button>
        {/each}
        <input type="text" inputmode="decimal" placeholder="Grad" aria-label="Neigung in Grad" value={dach.slopeDeg ?? ""} onchange={neigungEingabe} data-testid="neigung-eingabe" />
      </div>
      {#if dach.slopeDeg === null}<span class="fehlt" data-testid="neigung-fehlt">Neigung fehlt</span>{/if}
    </div>
    <div class="zeile">
      <span class="etikett">Fallrichtung</span>
      <div class="knoepfe">
        <button class:an={z.traufeWahl} class="primary" onclick={() => (z.traufeWahl = !z.traufeWahl)} data-testid="traufe-waehlen">
          {z.traufeWahl ? "Traufkante antippen …" : "Traufkante antippen"}
        </button>
        <input type="text" inputmode="decimal" placeholder="Grad" aria-label="Fallrichtung in Grad" value={dach.azimuthDeg ?? ""} onchange={richtungEingabe} data-testid="richtung-eingabe" />
      </div>
      <div class="knoepfe">
        <select aria-label="Himmelsrichtung wählen" onchange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v !== "") z.setzeAusrichtung(dach.id, Number(v)); (e.target as HTMLSelectElement).value = ""; }} data-testid="richtung-auswahl">
          <option value="">Himmelsrichtung …</option>
          {#each RICHTUNGEN as [name, grad]}<option value={grad}>{name} ({grad}°)</option>{/each}
        </select>
      </div>
      {#if dach.azimuthDeg === null}
        <span class="fehlt" data-testid="richtung-fehlt">Fallrichtung fehlt</span>
      {:else}
        <span class="wert" data-testid="richtung-wert">{dach.azimuthDeg.toFixed(1).replace(".", ",")}° ({himmelsrichtung(dach.azimuthDeg)})</span>
      {/if}
    </div>
  </section>
{/if}

<style>
  .eig { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 8px; }
  .zeile { display: grid; gap: 6px; }
  .etikett { font-size: 13px; color: var(--muted); }
  .knoepfe { display: flex; flex-wrap: wrap; gap: 6px; }
  .knoepfe button { min-height: 40px; padding: 0 10px; flex: 0 0 auto; }
  button.an { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--bg)); }
  select { font: inherit; min-height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
  input { font: inherit; width: 84px; min-height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
  .fehlt { color: var(--bad); font-size: 14px; }
  .wert { font-size: 14px; }
</style>
