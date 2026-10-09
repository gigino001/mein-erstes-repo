<script lang="ts">
  import type { EditorZustand } from "./zustand.svelte";
  import { flaeche, selbstschnitt } from "./geom";

  let { z, gespeichert }: { z: EditorZustand; gespeichert: boolean } = $props();

  const dach = $derived(z.gewaehltesDach);
  const grundflaeche = $derived(dach ? flaeche(dach.outline) : 0);
  const kreuzt = $derived(dach ? selbstschnitt(dach.outline) : false);
  const hinweis = $derived.by(() => {
    if (z.werkzeug === "dach") {
      const n = z.entwurf.length;
      if (n === 0) return "Tippe die Ecken des Daches nacheinander an.";
      if (n < 3) return `${n} Ecke${n === 1 ? "" : "n"} – weiter antippen.`;
      return `${n} Ecken – „Fertig“ drücken oder den grünen ersten Punkt antippen.`;
    }
    if (!dach) return z.projekt.roofs.length === 0 ? "Noch keine Dachfläche. Wähle „Dach“ und zeichne eine." : "Tippe eine Dachfläche an.";
    if (z.auswahl?.punkt !== null && z.auswahl?.punkt !== undefined) return "Ecke ziehen oder „Ecke löschen“.";
    return "Ecken ziehen, weiße Punkte tippen fügen eine Ecke ein. Fläche ziehen verschiebt sie.";
  });
  const deutsch = (x: number) => x.toFixed(1).replace(".", ",");
</script>

<section class="leiste" aria-label="Werkzeuge">
  <p class="hinweis" data-testid="hinweis">{hinweis}</p>
  {#if dach && z.werkzeug === "auswahl"}
    <p class="chip" data-testid="dachinfo">
      <strong>{dach.name}</strong> · Grundfläche <span data-testid="grundflaeche">{deutsch(grundflaeche)}</span> m²
      {#if kreuzt}<span class="warn" data-testid="kreuzt"> · Umriss kreuzt sich</span>{/if}
    </p>
  {/if}
  <div class="reihe">
    <button class:an={z.werkzeug === "auswahl"} onclick={() => z.setzeWerkzeug("auswahl")} data-testid="werkzeug-auswahl">Auswahl</button>
    <button class:an={z.werkzeug === "dach"} onclick={() => z.setzeWerkzeug("dach")} data-testid="werkzeug-dach">Dach</button>
    <button onclick={() => z.rueckgaengig()} disabled={!z.kannZurueck} aria-label="Rückgängig" data-testid="rueckgaengig">↶</button>
    <button onclick={() => z.wiederholen()} disabled={!z.kannVor} aria-label="Wiederholen" data-testid="wiederholen">↷</button>
  </div>
  {#if z.werkzeug === "dach" && z.entwurf.length > 0}
    <div class="reihe">
      <button class="primary" onclick={() => z.entwurfAbschliessen()} disabled={z.entwurf.length < 3} data-testid="fertig">Fertig</button>
      <button onclick={() => z.entwurfLetztenEntfernen()} data-testid="letzte-ecke">Letzte Ecke zurück</button>
      <button onclick={() => z.entwurfVerwerfen()} data-testid="verwerfen">Verwerfen</button>
    </div>
  {/if}
  {#if z.werkzeug === "auswahl" && dach}
    <div class="reihe">
      {#if z.auswahl?.punkt !== null && z.auswahl?.punkt !== undefined}
        <button class="gefahr" onclick={() => z.punktEntfernen()} disabled={dach.outline.length <= 3} data-testid="punkt-loeschen">Ecke löschen</button>
      {/if}
      <button class="gefahr" onclick={() => z.dachEntfernen()} data-testid="dach-loeschen">Dachfläche löschen</button>
    </div>
  {/if}
  <p class="speicher" data-testid="speicherstand">{gespeichert ? "Gespeichert" : "Speichert …"}</p>
</section>

<style>
  .leiste { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; background: var(--bg); border-radius: 16px 16px 0 0; padding: 10px 12px max(12px, env(safe-area-inset-bottom)); display: grid; gap: 8px; box-shadow: 0 -4px 20px rgba(0,0,0,.3); }
  p { margin: 0; }
  .hinweis { font-size: 14px; color: var(--muted); }
  .chip { font-size: 15px; }
  .warn { color: var(--bad); }
  .reihe { display: flex; flex-wrap: wrap; gap: 8px; }
  .reihe button { flex: 1 1 auto; padding: 0 12px; }
  button.an { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, var(--bg)); }
  button:disabled { opacity: .4; }
  .gefahr { color: var(--bad); }
  .speicher { font-size: 12px; color: var(--muted); text-align: right; }
</style>
