import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBlob } from "@/lib/blob-storage";
import { ALLOWED_DOCUMENT_MIME_TYPES, sanitizeFileNameForHeader } from "@/lib/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Nicht angemeldet", { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }

  const data = await getBlob(document.blobKey);
  if (!data) {
    return new NextResponse("Datei nicht gefunden", { status: 404 });
  }

  // Nur bekannte, sichere Dateitypen werden inline ausgeliefert (Bilder,
  // PDF); alles andere erzwungen als Download, damit der Browser nichts als
  // HTML/SVG interpretieren kann. Zusätzliches Sicherheitsnetz falls je ein
  // Dokument mit unzulässigem Typ in die DB gelangt (Upload ist bereits
  // durch dieselbe Allowlist geschützt).
  const disposition = ALLOWED_DOCUMENT_MIME_TYPES.has(document.mimeType)
    ? "inline"
    : "attachment";
  const safeFileName = sanitizeFileNameForHeader(document.fileName);

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `${disposition}; filename="${safeFileName}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
