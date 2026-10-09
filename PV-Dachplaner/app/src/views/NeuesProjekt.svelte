<script lang="ts">
  import Karte from "../lib/Karte.svelte";
  import { router } from "../lib/router.svelte";
  import { lngLatToUtm } from "../lib/coords";
  import { neuesProjekt } from "../lib/model";
  import { dauerhaftAnfordern, speichern } from "../lib/store";
  import { ladeBildInfo } from "../lib/bildflug";

  let mitte = { lng: 8.5325, lat: 52.0302 };
  let name = $state("");
  let arbeitet = $state(false);

  async function anlegen() {
    arbeitet = true;
    const pos = lngLatToUtm(mitte);
    let imageDate: string | null = null;
    try {
      imageDate = (await ladeBildInfo(pos))?.datum ?? null;
    } catch {
      /* Datum ist optional */
    }
    const standard = `Projekt ${new Date().toLocaleDateString("de-DE")}`;
    const p = await speichern(neuesProjekt({ name: name.trim() || standard, adresse: { text: "", position: pos }, imageDate }));
    void dauerhaftAnfordern();
    router.gehe({ name: "projekt", id: p.id });
  }
</script>

<div class="seite">
  <Karte zoom={18} onMove={(c) => (mitte = { lng: c.lng, lat: c.lat })} />
  <div class="kreuz" aria-hidden="true"></div>
  <header>
    <button onclick={() => router.zurueck()} aria-label="Zurück">‹ Zurück</button>
  </header>
  <section class="blatt">
    <p><strong>Neues Projekt</strong><br /><span class="muted">Verschiebe die Karte, bis das Kreuz auf dem Haus liegt.</span></p>
    <input type="text" placeholder="Name (optional), z. B. Familie Muster" bind:value={name} data-testid="name" />
    <button class="primary" onclick={anlegen} disabled={arbeitet} data-testid="anlegen">Hier anlegen</button>
  </section>
</div>

<style>
  .seite { position: fixed; inset: 0; }
  .kreuz { position: absolute; left: 50%; top: 42%; width: 36px; height: 36px; margin: -18px 0 0 -18px; z-index: 2; pointer-events: none;
    background:
      linear-gradient(#fff, #fff) center / 2px 100% no-repeat,
      linear-gradient(#fff, #fff) center / 100% 2px no-repeat;
    filter: drop-shadow(0 0 2px #000); }
  header { position: absolute; top: max(8px, env(safe-area-inset-top)); left: 8px; z-index: 3; }
  header button { background: rgba(0,0,0,.6); color: #fff; border-color: transparent; }
  .blatt { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; background: var(--bg); border-radius: 16px 16px 0 0; padding: 14px 16px max(16px, env(safe-area-inset-bottom)); display: grid; gap: 10px; box-shadow: 0 -4px 20px rgba(0,0,0,.3); }
  .blatt p { margin: 0; }
  .muted { color: var(--muted); font-size: 14px; }
  input { font: inherit; min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
</style>
