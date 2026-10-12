import { MODULE, WECHSELRICHTER, leseModul, leseWechselrichter, type ModulTyp, type WechselrichterTyp } from "./geraete";

const SCHLUESSEL = "pv-eigene-geraete";

function lesen(): { module: ModulTyp[]; wechselrichter: WechselrichterTyp[] } {
  try {
    const raw = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? "null") as { module?: unknown[]; wechselrichter?: unknown[] } | null;
    return {
      module: (raw?.module ?? []).map(leseModul).filter((x): x is ModulTyp => !!x),
      wechselrichter: (raw?.wechselrichter ?? []).map(leseWechselrichter).filter((x): x is WechselrichterTyp => !!x),
    };
  } catch {
    return { module: [], wechselrichter: [] };
  }
}

/** Geräteliste: eingebaute Datenblattwerte plus eigene Einträge (im Browser gespeichert, als JSON sicher- und einlesbar). */
class Geraete {
  eigeneModule = $state<ModulTyp[]>(lesen().module);
  eigeneWr = $state<WechselrichterTyp[]>(lesen().wechselrichter);

  get module(): ModulTyp[] {
    return [...MODULE, ...this.eigeneModule];
  }
  get wechselrichter(): WechselrichterTyp[] {
    return [...WECHSELRICHTER, ...this.eigeneWr];
  }
  modul(id: string | null | undefined) {
    return this.module.find((m) => m.id === id) ?? null;
  }
  wr(id: string | null | undefined) {
    return this.wechselrichter.find((w) => w.id === id) ?? null;
  }
  eigen(id: string) {
    return id.startsWith("eigen-");
  }
  private speichern() {
    try {
      localStorage.setItem(SCHLUESSEL, JSON.stringify({ module: $state.snapshot(this.eigeneModule), wechselrichter: $state.snapshot(this.eigeneWr) }));
    } catch {
      /* ohne Speicher weiter */
    }
  }
  neueId() {
    return `eigen-${crypto.randomUUID()}`;
  }
  speichereModul(m: ModulTyp) {
    const i = this.eigeneModule.findIndex((x) => x.id === m.id);
    if (i >= 0) this.eigeneModule[i] = m;
    else this.eigeneModule.push(m);
    this.speichern();
  }
  speichereWr(w: WechselrichterTyp) {
    const i = this.eigeneWr.findIndex((x) => x.id === w.id);
    if (i >= 0) this.eigeneWr[i] = w;
    else this.eigeneWr.push(w);
    this.speichern();
  }
  loesche(id: string) {
    this.eigeneModule = this.eigeneModule.filter((m) => m.id !== id);
    this.eigeneWr = this.eigeneWr.filter((w) => w.id !== id);
    this.speichern();
  }
  exportJson(): string {
    return JSON.stringify({ format: "pv-dachplaner-geraete/1", module: $state.snapshot(this.eigeneModule), wechselrichter: $state.snapshot(this.eigeneWr) }, (_k, v) => (typeof v === "number" && Number.isNaN(v) ? null : v), 1);
  }
  /** Liest eine Gerätedatei ein; vorhandene Kennungen werden ersetzt. Gibt die Zahl gelesener Einträge zurück. */
  importJson(text: string): { module: number; wechselrichter: number; fehler: number } {
    const raw = JSON.parse(text) as { module?: unknown[]; wechselrichter?: unknown[] };
    let fehler = 0;
    let nm = 0, nw = 0;
    for (const x of raw.module ?? []) {
      const m = leseModul(x);
      if (m && m.id.startsWith("eigen-")) (this.speichereModul(m), nm++);
      else fehler++;
    }
    for (const x of raw.wechselrichter ?? []) {
      const w = leseWechselrichter(x);
      if (w && w.id.startsWith("eigen-")) (this.speichereWr(w), nw++);
      else fehler++;
    }
    return { module: nm, wechselrichter: nw, fehler };
  }
}

export const geraete = new Geraete();
