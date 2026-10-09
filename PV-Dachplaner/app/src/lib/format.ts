/** „heute 10:42“, „gestern 09:15“ oder „03.10.2026“ – für die Projektliste. */
export function geaendertText(iso: string, jetzt: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tag = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const uhr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (tag(d) === tag(jetzt)) return `heute ${uhr}`;
  const gestern = new Date(jetzt);
  gestern.setDate(gestern.getDate() - 1);
  if (tag(d) === tag(gestern)) return `gestern ${uhr}`;
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function dachflaechenText(anzahl: number): string {
  if (anzahl === 0) return "noch keine Dachfläche";
  return anzahl === 1 ? "1 Dachfläche" : `${anzahl} Dachflächen`;
}
