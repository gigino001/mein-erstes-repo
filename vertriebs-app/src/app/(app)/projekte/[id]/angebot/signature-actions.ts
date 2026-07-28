"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { putBlob, deleteBlob } from "@/lib/blob-storage";
import { decodeSignatureDataUrl } from "@/lib/signature";

export async function saveSignatureAction(
  projectId: string,
  offerId: string,
  dataUrl: string
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const buffer = decodeSignatureDataUrl(dataUrl);
  if (!buffer) return;

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.projectId !== projectId) return;

  const blobKey = `${projectId}/${randomUUID()}`;
  await putBlob(blobKey, buffer);

  await prisma.offer.update({
    where: { id: offerId },
    data: { signatureBlobKey: blobKey, signedAt: new Date() },
  });

  // Eine alte Unterschrift wird erst nach dem erfolgreichen Update entfernt,
  // damit bei einem Fehler nicht beide Fassungen verloren gehen.
  if (offer.signatureBlobKey) {
    await deleteBlob(offer.signatureBlobKey);
  }

  // Unterschrift = Auftragserteilung: alle Leistungen des Vorgangs, die noch
  // vor dem Auftragsstatus stehen, werden auf "Auftrag" gesetzt.
  await advanceVariantsToAuftrag(projectId);

  revalidatePath(`/projekte/${projectId}`);
  revalidatePath(`/projekte/${projectId}/angebot`);
}

export async function deleteSignatureAction(projectId: string, offerId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer || offer.projectId !== projectId || !offer.signatureBlobKey) return;

  await prisma.offer.update({
    where: { id: offerId },
    data: { signatureBlobKey: null, signedAt: null },
  });
  await deleteBlob(offer.signatureBlobKey);

  revalidatePath(`/projekte/${projectId}`);
  revalidatePath(`/projekte/${projectId}/angebot`);
}

// Setzt jede Leistung des Vorgangs auf den dritten Status ihres Workflows
// ("Auftrag" in den Standard-Workflows), sofern sie noch davor steht.
// Bereits weiter fortgeschrittene Leistungen bleiben unangetastet.
async function advanceVariantsToAuftrag(projectId: string) {
  const variants = await prisma.projectVariant.findMany({
    where: { projectId },
    include: { status: true },
  });

  for (const variant of variants) {
    const statuses = await prisma.statusDefinition.findMany({
      where: { variantType: variant.variantType },
      orderBy: { sortOrder: "asc" },
    });
    const auftragStatus = statuses[2];
    if (!auftragStatus) continue;
    if (variant.status.sortOrder >= auftragStatus.sortOrder) continue;

    await prisma.projectVariant.update({
      where: { id: variant.id },
      data: { statusId: auftragStatus.id },
    });
  }
}
