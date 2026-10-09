<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type maplibregl from "maplibre-gl";
  import Karte from "../lib/Karte.svelte";
  import Werkzeugleiste from "../lib/editor/Werkzeugleiste.svelte";
  import { EditorZustand } from "../lib/editor/zustand.svelte";
  import { Ueberlagerung } from "../lib/editor/ueberlagerung";
  import { router } from "../lib/router.svelte";
  import { autospeicher, projekt } from "../lib/store";
  import { utmToLngLat } from "../lib/coords";
  import type { Project } from "../lib/model";

  let { id }: { id: string } = $props();
  let p = $state<Project | null | undefined>(undefined);
  let z = $state<EditorZustand | undefined>();
  let ueb = $state<Ueberlagerung | undefined>();
  let gespeichert = $state(true);
  let auto: ReturnType<typeof autospeicher> | undefined;

  onMount(async () => {
    const geladen = (await projekt(id)) ?? null;
    p = geladen;
    if (!geladen) return;
    auto = autospeicher((s) => {
      // Version und Zeit übernehmen, ohne eine neue Speicherung auszulösen
      if (z) {
        z.projekt.version = s.version;
        z.projekt.updated = s.updated;
      }
      gespeichert = true;
    });
    z = new EditorZustand(geladen, (neu) => {
      gespeichert = false;
      auto!.planen(neu);
    });
    (window as unknown as { __pv?: unknown }).__pv = { zustand: z, projekt: () => $state.snapshot(z!.projekt) };
    window.addEventListener("keydown", taste);
    document.addEventListener("visibilitychange", sichern);
    window.addEventListener("pagehide", sichern);
  });

  function sichern() {
    if (document.visibilityState === "hidden" || document.visibilityState === undefined) void auto?.leeren();
  }
  onDestroy(() => {
    window.removeEventListener("keydown", taste);
    document.removeEventListener("visibilitychange", sichern);
    window.removeEventListener("pagehide", sichern);
    ueb?.entfernen();
    void auto?.leeren();
  });

  function taste(e: KeyboardEvent) {
    if (!z || (e.target as HTMLElement)?.matches?.("input, textarea")) return;
    const strg = e.ctrlKey || e.metaKey;
    if (strg && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? z.wiederholen() : z.rueckgaengig();
    } else if (strg && e.key.toLowerCase() === "y") {
      e.preventDefault();
      z.wiederholen();
    } else if (e.key === "Escape") z.entwurfVerwerfen();
    else if (e.key === "Enter" && z.werkzeug === "dach") z.entwurfAbschliessen();
    else if ((e.key === "Delete" || e.key === "Backspace") && z.werkzeug === "auswahl") {
      if (z.auswahl?.punkt !== null && z.auswahl?.punkt !== undefined) z.punktEntfernen();
      else z.dachEntfernen();
    }
  }

  function kartebereit(map: maplibregl.Map) {
    ueb = new Ueberlagerung(map, z!);
  }
  // Ebenen neu zeichnen, sobald sich der Zustand ändert (liest Zustand → reaktiv)
  $effect(() => {
    ueb?.zeichnen();
  });
  const mitte = $derived(p?.adresse.position ? utmToLngLat(p.adresse.position) : null);
</script>

{#if p === undefined}
  <p class="info">Lädt …</p>
{:else if p === null}
  <div class="info">
    <p>Dieses Projekt gibt es nicht (mehr).</p>
    <button class="primary" onclick={() => router.gehe({ name: "liste" })}>Zur Projektliste</button>
  </div>
{:else if z}
  <div class="seite">
    <Karte center={mitte ? [mitte.lng, mitte.lat] : undefined} zoom={mitte ? 19 : 17} onReady={kartebereit} />
    <header>
      <button onclick={() => router.gehe({ name: "liste" })} aria-label="Zur Projektliste">‹</button>
      <strong data-testid="projektname">{p.name}</strong>
    </header>
    {#if p.imageDate}<div class="bild">Luftbild vom {p.imageDate.split("-").reverse().join(".")}</div>{/if}
    <Werkzeugleiste {z} {gespeichert} />
  </div>
{/if}

<style>
  .seite { position: fixed; inset: 0; }
  header { position: absolute; top: max(8px, env(safe-area-inset-top)); left: 8px; right: 60px; z-index: 3; display: flex; gap: 8px; align-items: center; color: #fff; }
  header button { background: rgba(0,0,0,.6); color: #fff; border-color: transparent; width: 44px; padding: 0; font-size: 22px; }
  header strong { background: rgba(0,0,0,.6); padding: 8px 12px; border-radius: 10px; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bild { position: absolute; left: 8px; top: calc(max(8px, env(safe-area-inset-top)) + 54px); z-index: 2; background: rgba(0,0,0,.6); color: #fff; font-size: 12px; padding: 4px 8px; border-radius: 6px; }
  .info { padding: 24px 16px; }
</style>
