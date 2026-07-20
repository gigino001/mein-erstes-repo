"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildOfferData } from "@/lib/offer-data";

export async function saveOfferAction(projectId: string) {
  const offerData = await buildOfferData(projectId);
  if (!offerData) return;

  const salesPriceGross = offerData.salesPriceNet * 1.19;

  await prisma.offer.create({
    data: {
      projectId,
      offerNumber: offerData.offerNumber,
      totalNet: offerData.salesPriceNet,
      totalGross: salesPriceGross,
    },
  });

  await prisma.project.updateMany({
    where: { id: projectId, status: "NEU" },
    data: { status: "ANGEBOT" },
  });

  revalidatePath(`/projekte/${projectId}`);
  revalidatePath(`/projekte/${projectId}/angebot`);
}
