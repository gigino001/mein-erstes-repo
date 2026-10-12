<script lang="ts">
  import type { EditorZustand } from "./zustand.svelte";
  import type { ObstacleArt } from "../model";

  let { z }: { z: EditorZustand } = $props();
  const h = $derived(z.gewaehltesHindernis);
  const ARTEN: [ObstacleArt, string][] = [
    ["kamin", "Kamin"],
    ["dachfenster", "Dachfenster"],
    ["gaube", "Gaube"],
    ["antenne", "Antenne / Sat"],
    ["luefter", "Lüfter"],
    ["sonstiges", "Sonstiges"],
  ];
</script>

{#if h && z.werkzeug === "auswahl"}
  <section class="eig" aria-label="Eigenschaften des Hindernisses">
    <div class="zeile">
      <span class="etikett">Art</span>
      <select value={h.art} onchange={(e) => z.setzeHindernisArt(h.id, (e.target as HTMLSelectElement).value as ObstacleArt)} data-testid="hindernis-art" aria-label="Art des Hindernisses">
        {#each ARTEN as [wert, name]}<option value={wert}>{name}</option>{/each}
      </select>
    </div>
    <div class="zeile">
      <span class="etikett">Von der Fläche abziehen</span>
      <div class="knoepfe">
        <button class:an={h.abziehen} onclick={() => z.setzeHindernisAbziehen(h.id, true)} data-testid="abziehen-ja">ja</button>
        <button class:an={!h.abziehen} onclick={() => z.setzeHindernisAbziehen(h.id, false)} data-testid="abziehen-nein">nein (nur Hinweis)</button>
      </div>
    </div>
    <div class="zeile">
      <span class="etikett">Abstand um das Hindernis</span>
      <div class="knoepfe">
        <button class:an={h.bufferM === 0} onclick={() => z.setzeHindernisPuffer(h.id, 0)} data-testid="puffer-0">aus</button>
        <button class:an={h.bufferM === 0.2} onclick={() => z.setzeHindernisPuffer(h.id, 0.2)} data-testid="puffer-0.2">20 cm</button>
        <button class:an={h.bufferM === 0.3} onclick={() => z.setzeHindernisPuffer(h.id, 0.3)} data-testid="puffer-0.3">30 cm</button>
      </div>
    </div>
    <div class="zeile">
      <span class="etikett">Drehen</span>
      <div class="knoepfe">
        <button onclick={() => z.drehe(h.id, -5)} aria-label="5 Grad nach rechts drehen" data-testid="drehen-rechts">⟳ 5°</button>
        <button onclick={() => z.drehe(h.id, 5)} aria-label="5 Grad nach links drehen" data-testid="drehen-links">⟲ 5°</button>
        <button onclick={() => z.drehe(h.id, -90)} aria-label="90 Grad nach rechts drehen">⟳ 90°</button>
      </div>
    </div>
  </section>
{/if}

<style>
  .eig { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 8px; }
  .zeile { display: grid; gap: 6px; }
  .etikett { font-size: 13px; color: var(--muted); }
  .knoepfe { display: flex; flex-wrap: wrap; gap: 6px; }
  .knoepfe button { min-height: 40px; padding: 0 12px; }
  button.an { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--bg)); }
  select { font: inherit; min-height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
</style>
