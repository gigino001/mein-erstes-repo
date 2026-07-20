import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { buildOfferData } from "@/lib/offer-data";
import { OfferDocument } from "@/lib/pdf/offer-document";

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

  const buffer = await renderToBuffer(<OfferDocument {...offerData} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${offerData.offerNumber}.pdf"`,
    },
  });
}
