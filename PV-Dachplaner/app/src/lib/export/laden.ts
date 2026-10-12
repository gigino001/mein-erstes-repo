/** Datei auf dem Gerät speichern (Download) oder über das Teilen-Menü weitergeben (z. B. iPhone: Mail, Dateien, CRM-App). */

export function speichereDatei(name: string, daten: BlobPart, typ: string) {
  const blob = new Blob([daten], { type: typ });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export function kannTeilen(name: string, typ: string): boolean {
  try {
    const f = new File([new Uint8Array(1)], name, { type: typ });
    return !!navigator.canShare?.({ files: [f] });
  } catch {
    return false;
  }
}

export async function teileDatei(name: string, daten: Uint8Array, typ: string): Promise<boolean> {
  try {
    const f = new File([daten as BlobPart], name, { type: typ });
    if (!navigator.canShare?.({ files: [f] })) return false;
    await navigator.share({ files: [f], title: name });
    return true;
  } catch (e) {
    if ((e as Error).name === "AbortError") return true; // Nutzer hat abgebrochen
    return false;
  }
}
