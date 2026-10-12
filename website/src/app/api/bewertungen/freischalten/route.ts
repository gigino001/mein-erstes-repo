import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
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

  if (review.status === "approved") {
    return moderationResultPage({
      title: "Schon freigeschaltet",
      message: `Die Bewertung von ${review.customerName} ist bereits auf der Website sichtbar.`,
      tone: "info",
    });
  }

  await prisma.review.update({
    where: { token },
    data: { status: "approved", approvedAt: new Date() },
  });
  revalidatePath("/");

  return moderationResultPage({
    title: "Freigeschaltet!",
    message: `Die Bewertung von ${review.customerName} ist jetzt auf der Website sichtbar.`,
    tone: "success",
  });
}
