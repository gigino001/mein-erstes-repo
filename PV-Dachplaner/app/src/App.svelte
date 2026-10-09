<script lang="ts">
  import { beispielRechnung } from "./demo";
  import { APP_VERSION } from "./lib-version";

  const r = beispielRechnung();
</script>

<main>
  <h1>PV-Dachplaner</h1>
  <p class="muted">Version {APP_VERSION} · Gerüst (Arbeitspaket 1)</p>

  <section aria-label="Rechenbeispiel">
    <h2>Rechenkern-Test</h2>
    <p>Satteldach-Seite 10 × 5 m, 35° Neigung:</p>
    <ul>
      <li data-testid="flaeche">Dachfläche {r.flaecheM2.toFixed(2).replace(".", ",")} m²</li>
      <li data-testid="module">{r.module} Module hochkant</li>
      <li data-testid="kwp">{r.kWp.toFixed(2).replace(".", ",")} kWp</li>
    </ul>
  </section>
</main>

<style>
  main { max-width: 640px; margin: 0 auto; padding: 16px; padding-top: max(16px, env(safe-area-inset-top)); }
  h1 { font-size: 22px; margin: 8px 0 0; }
  h2 { font-size: 18px; }
  .muted { color: var(--muted); margin-top: 4px; }
  section { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 4px 16px 12px; margin-top: 16px; }
</style>
