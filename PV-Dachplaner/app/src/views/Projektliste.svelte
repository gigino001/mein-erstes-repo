<script lang="ts">
  import { onMount } from "svelte";
  import { router } from "../lib/router.svelte";
  import { alleProjekte, duplizieren, exportieren, importieren, loeschen } from "../lib/store";
  import { dachflaechenText, geaendertText } from "../lib/format";
  import type { Project } from "../lib/model";

  let projekte = $state<Project[] | null>(null);
  let menue = $state<string | null>(null);
  let meldung = $state("");

  async function laden() {
    projekte = await alleProjekte();
  }
  onMount(laden);

  async function loeschenFrage(p: Project) {
    menue = null;
    if (confirm(`„${p.name}“ endgültig löschen?`)) {
      await loeschen(p.id);
      await laden();
    }
  }
  async function kopieren(p: Project) {
    menue = null;
    await duplizieren(p.id);
    await laden();
  }
  async function sicherung() {
    const s = await exportieren();
    const blob = new Blob([JSON.stringify(s, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pv-dachplaner-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    meldung = `${s.projekte.length} Projekt(e) gesichert`;
  }
  async function einlesen(e: Event) {
    const datei = (e.target as HTMLInputElement).files?.[0];
    if (!datei) return;
    try {
      const r = await importieren(await datei.text());
      meldung = `Eingelesen: ${r.neu} neu, ${r.aktualisiert} aktualisiert, ${r.uebersprungen} übersprungen` + (r.fehler.length ? `, ${r.fehler.length} fehlerhaft (${r.fehler[0]})` : "");
      await laden();
    } catch (err) {
      meldung = (err as Error).message;
    }
    (e.target as HTMLInputElement).value = "";
  }
</script>

<main>
  <header>
    <h1>PV-Dachplaner</h1>
    <button class="primary" onclick={() => router.gehe({ name: "neu" })} data-testid="neu">+ Neu</button>
  </header>

  {#if projekte === null}
    <p class="muted">Lädt …</p>
  {:else if projekte.length === 0}
    <p class="leer" data-testid="leer">Noch keine Projekte. Tippe auf „+ Neu“, um ein Haus auf der Karte zu wählen.</p>
  {:else}
    <ul data-testid="projekte">
      {#each projekte as p (p.id)}
        <li>
          <button class="karte" onclick={() => router.gehe({ name: "projekt", id: p.id })}>
            <strong>{p.name}</strong>
            {#if p.adresse.text}<span>{p.adresse.text}</span>{/if}
            <span class="muted">{dachflaechenText(p.roofs.length)} · {geaendertText(p.updated)}</span>
          </button>
          <button class="mehr" aria-label="Mehr zu {p.name}" onclick={() => (menue = menue === p.id ? null : p.id)}>⋯</button>
          {#if menue === p.id}
            <div class="menue" role="menu">
              <button role="menuitem" onclick={() => kopieren(p)}>Duplizieren</button>
              <button role="menuitem" class="gefahr" onclick={() => loeschenFrage(p)}>Löschen</button>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  <footer>
    <button onclick={sicherung}>Sicherung exportieren</button>
    <label class="datei">Sicherung einlesen<input type="file" accept="application/json,.json" onchange={einlesen} /></label>
    {#if meldung}<p class="muted" data-testid="meldung">{meldung}</p>{/if}
  </footer>
</main>

<style>
  main { max-width: 640px; margin: 0 auto; padding: max(12px, env(safe-area-inset-top)) 16px 32px; }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  h1 { font-size: 22px; margin: 8px 0; }
  ul { list-style: none; padding: 0; margin: 12px 0; display: grid; gap: 10px; }
  li { position: relative; }
  .karte { width: 100%; text-align: left; display: grid; gap: 2px; padding: 12px 52px 12px 14px; background: var(--panel); min-height: 72px; }
  .mehr { position: absolute; right: 6px; top: 6px; width: 44px; border: none; background: transparent; font-size: 22px; }
  .menue { position: absolute; right: 8px; top: 52px; z-index: 5; background: var(--bg); border: 1px solid var(--line); border-radius: 10px; display: grid; box-shadow: 0 4px 16px rgba(0,0,0,.25); }
  .menue button { border: none; text-align: left; border-radius: 0; }
  .gefahr { color: var(--bad); }
  .muted { color: var(--muted); font-size: 14px; }
  .leer { padding: 24px 8px; color: var(--muted); }
  footer { margin-top: 24px; display: grid; gap: 8px; }
  .datei { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; border: 1px solid var(--line); border-radius: 10px; cursor: pointer; }
  .datei input { display: none; }
</style>
