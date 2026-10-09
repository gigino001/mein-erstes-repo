<script lang="ts">
  import { onMount } from "svelte";
  import Karte from "../lib/Karte.svelte";
  import { router } from "../lib/router.svelte";
  import { projekt } from "../lib/store";
  import { utmToLngLat } from "../lib/coords";
  import type { Project } from "../lib/model";

  let { id }: { id: string } = $props();
  let p = $state<Project | null | undefined>(undefined);

  onMount(async () => {
    p = (await projekt(id)) ?? null;
  });
</script>

{#if p === undefined}
  <p class="info">Lädt …</p>
{:else if p === null}
  <div class="info">
    <p>Dieses Projekt gibt es nicht (mehr).</p>
    <button class="primary" onclick={() => router.gehe({ name: "liste" })}>Zur Projektliste</button>
  </div>
{:else}
  <div class="seite">
    {#if p.adresse.position}
      {@const c = utmToLngLat(p.adresse.position)}
      <Karte center={[c.lng, c.lat]} zoom={19} />
    {:else}
      <Karte zoom={17} />
    {/if}
    <header>
      <button onclick={() => router.gehe({ name: "liste" })} aria-label="Zur Projektliste">‹</button>
      <strong data-testid="projektname">{p.name}</strong>
    </header>
    {#if p.imageDate}<footer>Luftbild vom {p.imageDate.split("-").reverse().join(".")}</footer>{/if}
  </div>
{/if}

<style>
  .seite { position: fixed; inset: 0; }
  header { position: absolute; top: max(8px, env(safe-area-inset-top)); left: 8px; right: 60px; z-index: 3; display: flex; gap: 8px; align-items: center; color: #fff; }
  header button { background: rgba(0,0,0,.6); color: #fff; border-color: transparent; width: 44px; padding: 0; font-size: 22px; }
  header strong { background: rgba(0,0,0,.6); padding: 8px 12px; border-radius: 10px; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  footer { position: absolute; left: 8px; bottom: calc(max(8px, env(safe-area-inset-bottom)) + 30px); z-index: 2; background: rgba(0,0,0,.65); color: #fff; font-size: 13px; padding: 6px 10px; border-radius: 8px; }
  .info { padding: 24px 16px; }
</style>
