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

  const variants = await prisma.projectVariant.findMany({
    where: { projectId },
    include: { status: true },
  });

  for (const variant of variants) {
    if (variant.status.sortOrder !== 0) continue;
    const nextStatus = await prisma.statusDefinition.findFirst({
      where: { variantType: variant.variantType, sortOrder: { gt: 0 } },
      orderBy: { sortOrder: "asc" },
    });
    if (nextStatus) {
      await prisma.projectVariant.update({
        where: { id: variant.id },
        data: { statusId: nextStatus.id },
      });
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { offerExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
  });

  revalidatePath(`/projekte/${projectId}`);
  revalidatePath(`/projekte/${projectId}/angebot`);
}
