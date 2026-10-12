<script lang="ts">
  import { onMount } from "svelte";
  import { browserLader, loeseAuf, ortVorschlaege, strassenVorschlaege, zerlege, type Adresse, type GemeindeInfo, type Vorschlag } from "./adressen";

  let { onWaehle }: { onWaehle: (a: Adresse) => void } = $props();

  const lader = browserLader();
  let gemeinden = $state<GemeindeInfo[]>([]);
  let ort = $state<GemeindeInfo | null>(null);
  let ortText = $state("");
  let ortListe = $state<Vorschlag[]>([]);
  let strasseText = $state("");
  let festeStrasse = $state<string | null>(null);
  let liste = $state<Vorschlag[]>([]);
  let meldung = $state("");
  let gewaehlt = $state<Adresse | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let zaehler = 0;

  function merkeOrt(g: GemeindeInfo) {
    try {
      localStorage.setItem("pv-ort", g.key);
    } catch {
      /* ohne Speicher weiter */
    }
  }

  onMount(async () => {
    try {
      gemeinden = await lader.gemeinden();
    } catch {
      meldung = "Adressdaten sind nicht verfügbar. Du kannst das Haus auch auf der Karte wählen.";
      return;
    }
    let key: string | null = null;
    try {
      key = localStorage.getItem("pv-ort");
    } catch {
      /* ohne Speicher weiter */
    }
    ort = gemeinden.find((g) => g.key === key) ?? gemeinden.find((g) => g.gmd === "Bielefeld") ?? gemeinden[0] ?? null;
    ortText = ort?.gmd ?? "";
  });

  function ortEingabe() {
    ort = null;
    ortListe = ortVorschlaege(ortText, gemeinden);
  }
  function ortWaehlen(g: GemeindeInfo) {
    ort = g;
    ortText = g.gmd;
    ortListe = [];
    merkeOrt(g);
    strasseText = "";
    festeStrasse = null;
    liste = [];
  }

  async function aktualisieren() {
    const mein = ++zaehler;
    meldung = "";
    const e = zerlege(strasseText, gemeinden);
    const g = e.gemeinde ?? ort;
    if (strasseText.trim() === "") {
      liste = [];
      return;
    }
    if (!g) {
      meldung = "Bitte zuerst einen Ort wählen.";
      return;
    }
    try {
      const daten = await lader.daten(g.key);
      if (mein !== zaehler) return;
      if (festeStrasse && strasseText.startsWith(festeStrasse)) {
        // Straße ist gewählt: alle Hausnummern anbieten, nach der Eingabe gefiltert
        const rest = zerlege(strasseText.slice(festeStrasse.length), gemeinden);
        liste = strassenVorschlaege({ strasse: festeStrasse.split(/\s+/), nummer: rest.nummer ?? { zahl: "", zusatz: "" }, gemeinde: g }, g, daten, 12);
      } else {
        festeStrasse = null;
        liste = strassenVorschlaege(e, g, daten, 8);
      }
      if (liste.length === 0) meldung = "Nichts gefunden. Prüfe die Schreibweise oder wähle das Haus auf der Karte.";
    } catch {
      meldung = "Adressdaten dieses Orts sind nicht verfügbar.";
    }
  }
  function strasseEingabe() {
    gewaehlt = null;
    clearTimeout(timer);
    timer = setTimeout(aktualisieren, 120);
  }

  function waehleVorschlag(v: Vorschlag) {
    if (v.art === "strasse") {
      festeStrasse = v.strasse;
      strasseText = `${v.strasse} `;
      void aktualisieren();
    } else if (v.art === "adresse") {
      gewaehlt = v.adresse;
      strasseText = v.adresse.text;
      liste = [];
      festeStrasse = null;
      onWaehle(v.adresse);
    }
  }

  async function enter() {
    const a = await loeseAuf(strasseText, lader, ort?.key);
    if (a) {
      waehleVorschlag({ art: "adresse", text: a.text, adresse: a });
      return;
    }
    const erste = liste[0];
    if (erste) waehleVorschlag(erste);
  }
</script>

<div class="suche" role="search">
  <label class="feld">
    <span>Ort</span>
    <input type="text" bind:value={ortText} oninput={ortEingabe} autocomplete="off" autocapitalize="words" enterkeyhint="next" data-testid="ort" />
  </label>
  {#if ortListe.length > 0}
    <ul class="liste" data-testid="ort-liste">
      {#each ortListe as v}
        {#if v.art === "gemeinde"}<li><button onclick={() => ortWaehlen(v.gemeinde)}>{v.text}</button></li>{/if}
      {/each}
    </ul>
  {/if}
  <label class="feld">
    <span>Straße und Hausnummer</span>
    <input
      type="text"
      bind:value={strasseText}
      oninput={strasseEingabe}
      onkeydown={(e) => e.key === "Enter" && enter()}
      autocomplete="off"
      autocapitalize="words"
      enterkeyhint="search"
      placeholder="z. B. Herforder Str. 12"
      data-testid="strasse"
    />
  </label>
  {#if liste.length > 0}
    <ul class="liste" data-testid="vorschlaege">
      {#each liste as v}
        <li>
          <button onclick={() => waehleVorschlag(v)}>
            {v.text}{#if v.art === "strasse"}<span class="mut"> · {v.anzahl} Hausnr.</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
  {#if gewaehlt}<p class="ok" data-testid="gewaehlt">✓ {gewaehlt.text}</p>{/if}
  {#if meldung}<p class="mut" data-testid="suchmeldung">{meldung}</p>{/if}
</div>

<style>
  .suche { display: grid; gap: 6px; }
  .feld { display: grid; gap: 2px; font-size: 12px; color: var(--muted); }
  input { font: inherit; font-size: 16px; min-height: 44px; padding: 0 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--bg); color: var(--fg); }
  .liste { list-style: none; margin: 0; padding: 0; border: 1px solid var(--line); border-radius: 10px; overflow: hidden; max-height: 34vh; overflow-y: auto; background: var(--bg); }
  .liste button { width: 100%; text-align: left; border: none; border-radius: 0; border-bottom: 1px solid var(--line); min-height: 44px; }
  .liste li:last-child button { border-bottom: none; }
  .mut { color: var(--muted); font-size: 13px; margin: 0; }
  .ok { color: var(--ok); margin: 0; font-size: 14px; }
</style>
