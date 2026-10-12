import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { moderationResultPage } from "../_response";

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return moderationResultPage({
      title: "Ungültiger Link",
      message: "Dieser Link ist nicht vollständig. Bitte den Button direkt aus der Mail verwenden.",
      tone: "error",
    });
  }

  const review = await prisma.review.findUnique({ where: { token } });
  if (!review) {
    return moderationResultPage({
      title: "Nicht gefunden",
      message: "Diese Bewertung wurde bereits bearbeitet oder existiert nicht mehr.",
      tone: "info",
    });
  }

  await prisma.review.delete({ where: { token } });

  return moderationResultPage({
    title: "Abgelehnt",
    message: `Die Bewertung von ${review.customerName} wurde endgültig gelöscht.`,
    tone: "success",
  });
}
