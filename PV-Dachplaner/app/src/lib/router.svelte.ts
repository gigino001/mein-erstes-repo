/** Minimaler Router über den URL-Teil nach `#` (funktioniert mit der Zurück-Taste und ohne Server-Einstellungen). */
export type Ansicht = { name: "liste" } | { name: "neu" } | { name: "projekt"; id: string };

export function leseHash(hash: string): Ansicht {
  const h = hash.replace(/^#\/?/, "");
  if (h === "neu") return { name: "neu" };
  const m = /^p\/([A-Za-z0-9-]{8,})$/.exec(h);
  if (m?.[1]) return { name: "projekt", id: m[1] };
  return { name: "liste" };
}

export function hashFuer(a: Ansicht): string {
  if (a.name === "neu") return "#/neu";
  if (a.name === "projekt") return `#/p/${a.id}`;
  return "#/";
}

class Router {
  ansicht = $state<Ansicht>(leseHash(typeof location === "undefined" ? "" : location.hash));
  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", () => (this.ansicht = leseHash(location.hash)));
    }
  }
  gehe(a: Ansicht) {
    location.hash = hashFuer(a);
  }
  zurueck() {
    if (history.length > 1) history.back();
    else this.gehe({ name: "liste" });
  }
}

export const router = new Router();
