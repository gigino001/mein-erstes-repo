// Erlaubte Dateitypen für Uploads (Fotos + gängige Dokumente). Bewusst kein
// text/html, image/svg+xml o.ä., da diese im Browser inline gerendert werden
// könnten und damit ein Einfallstor für gespeichertes XSS wären.
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

// Entfernt Steuerzeichen und Anführungszeichen, die den
// Content-Disposition-Header aufbrechen könnten, und begrenzt die Länge.
export function sanitizeFileNameForHeader(name: string) {
  return name.replace(/[\x00-\x1f"\\]/g, "_").slice(0, 200);
}
