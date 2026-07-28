// Die Unterschrift wird im Browser auf einem <canvas> erfasst und als
// PNG-Data-URL an den Server geschickt. Hier wird sie streng validiert,
// bevor daraus ein Blob wird – der Client darf weder einen anderen Bildtyp
// noch beliebig große Daten unterschieben.

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

// PNG-Signatur (Magic Bytes) am Dateianfang.
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const MAX_SIGNATURE_BYTES = 1_000_000; // 1 MB reicht für eine Unterschrift deutlich

export function decodeSignatureDataUrl(dataUrl: string): Buffer | null {
  if (!dataUrl.startsWith(PNG_DATA_URL_PREFIX)) return null;

  const base64 = dataUrl.slice(PNG_DATA_URL_PREFIX.length);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;

  // Grobe Größenprüfung noch vor dem Dekodieren.
  if (base64.length > (MAX_SIGNATURE_BYTES * 4) / 3 + 4) return null;

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_SIGNATURE_BYTES) return null;
  if (!buffer.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) return null;

  return buffer;
}
