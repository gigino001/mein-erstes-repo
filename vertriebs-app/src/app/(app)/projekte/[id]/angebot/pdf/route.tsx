import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getBlob } from "@/lib/blob-storage";
import { buildOfferData } from "@/lib/offer-data";
import { OfferDocument, type OfferDocumentProps } from "@/lib/pdf/offer-document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { id } = await params;
  const offerData = await buildOfferData(id);
  if (!offerData) {
    return NextResponse.json({ error: "Angebot nicht verfügbar" }, { status: 404 });
  }

  // Liegt für das zuletzt gespeicherte Angebot eine Unterschrift vor, wird
  // sie als Nachweis mit ins PDF übernommen.
  let signature: OfferDocumentProps["signature"] = null;
  const latestOffer = await prisma.offer.findFirst({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });
  if (latestOffer?.signatureBlobKey && latestOffer.signedAt) {
    const data = await getBlob(latestOffer.signatureBlobKey);
    if (data) {
      signature = { data, signedAt: latestOffer.signedAt };
    }
  }

  const buffer = await renderToBuffer(
    <OfferDocument {...offerData} signature={signature} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${offerData.offerNumber}.pdf"`,
    },
  });
}
