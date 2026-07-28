import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBlob } from "@/lib/blob-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ offerId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Nicht angemeldet", { status: 401 });
  }

  const { offerId } = await params;
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer?.signatureBlobKey) {
    return new NextResponse("Nicht gefunden", { status: 404 });
  }

  const data = await getBlob(offer.signatureBlobKey);
  if (!data) {
    return new NextResponse("Datei nicht gefunden", { status: 404 });
  }

  // Der Typ ist beim Speichern gegen die PNG-Magic-Bytes geprüft worden,
  // deshalb ist inline hier unbedenklich; nosniff schließt Rest-Risiken aus.
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
