/** Rückgängig/Wiederholen über Schnappschüsse. Der Aufrufer meldet den Stand VOR einer Änderung mit `merken`. */
export class Verlauf<T> {
  private zurueck: T[] = [];
  private vor: T[] = [];
  constructor(private grenze = 200) {}

  merken(stand: T) {
    this.zurueck.push(structuredClone(stand));
    if (this.zurueck.length > this.grenze) this.zurueck.shift();
    this.vor = [];
  }
  get kannZurueck() {
    return this.zurueck.length > 0;
  }
  get kannVor() {
    return this.vor.length > 0;
  }
  /** Gibt den früheren Stand zurück (oder null) und merkt den aktuellen für „Wiederholen“. */
  rueckgaengig(aktuell: T): T | null {
    const s = this.zurueck.pop();
    if (s === undefined) return null;
    this.vor.push(structuredClone(aktuell));
    return s;
  }
  wiederholen(aktuell: T): T | null {
    const s = this.vor.pop();
    if (s === undefined) return null;
    this.zurueck.push(structuredClone(aktuell));
    return s;
  }
  leeren() {
    this.zurueck = [];
    this.vor = [];
  }
}
