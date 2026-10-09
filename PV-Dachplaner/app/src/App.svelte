<script lang="ts">
  import Karte from "./lib/Karte.svelte";
  import { lngLatToUtm } from "./lib/coords";
  import { alterJahre, datumDeutsch, ladeBildInfo, type BildInfo } from "./lib/bildflug";
  import { APP_VERSION } from "./lib-version";

  let bild = $state<BildInfo | null>(null);
  let bildFehler = $state(false);
  let zoom = $state(17);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abbruch: AbortController | undefined;

  /** Befliegungsdatum für die Kartenmitte nachladen (entprellt, damit beim Ziehen nicht jede Bewegung fragt). */
  function beiBewegung(c: { lng: number; lat: number; zoom: number }) {
    zoom = c.zoom;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      abbruch?.abort();
      abbruch = new AbortController();
      try {
        const info = await ladeBildInfo(lngLatToUtm({ lng: c.lng, lat: c.lat }), abbruch.signal);
        bild = info;
        bildFehler = info === null;
      } catch (e) {
        if ((e as Error).name !== "AbortError") bildFehler = true;
      }
    }, 600);
  }

  let alt = $derived(bild ? alterJahre(bild.datum) : 0);
</script>

<div class="seite">
  <Karte onMove={beiBewegung} />
  <header>
    <strong>PV-Dachplaner</strong>
    <span class="v">v{APP_VERSION}</span>
  </header>
  <footer data-testid="bildinfo">
    {#if bild}
      <span>Luftbild vom {datumDeutsch(bild.datum)}</span>
      {#if alt >= 3}<span class="warn"> · {alt} Jahre alt</span>{/if}
    {:else if bildFehler}
      <span class="warn">Bilddatum nicht verfügbar</span>
    {:else}
      <span>Luftbild wird geladen …</span>
    {/if}
    <span class="zoom">Stufe {zoom.toFixed(1)}</span>
  </footer>
</div>

<style>
  .seite { position: fixed; inset: 0; }
  header {
    position: absolute; top: 0; left: 0; right: 0; z-index: 2; pointer-events: none;
    padding: max(10px, env(safe-area-inset-top)) 14px 10px;
    display: flex; gap: 8px; align-items: baseline;
    background: linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,0)); color: #fff; font-size: 17px;
  }
  .v { font-size: 12px; opacity: .8; }
  footer {
    position: absolute; left: 8px; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 30px); z-index: 2;
    background: rgba(0,0,0,.65); color: #fff; font-size: 13px; padding: 6px 10px; border-radius: 8px;
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .warn { color: #ffd479; }
  .zoom { opacity: .7; }
</style>
