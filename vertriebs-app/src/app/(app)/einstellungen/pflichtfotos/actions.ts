"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
}

export async function createRequiredPhotoTypeAction(variantType: string, formData: FormData) {
  await requireAuth();
  const label = formData.get("label");
  if (typeof label !== "string" || !label.trim()) return;

  const maxSortOrder = await prisma.requiredPhotoType.aggregate({
    where: { variantType },
    _max: { sortOrder: true },
  });

  await prisma.requiredPhotoType.create({
    data: {
      variantType,
      label: label.trim(),
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/einstellungen/pflichtfotos");
}

export async function renameRequiredPhotoTypeAction(id: string, formData: FormData) {
  await requireAuth();
  const label = formData.get("label");
  if (typeof label !== "string" || !label.trim()) return;

  await prisma.requiredPhotoType.update({
    where: { id },
    data: { label: label.trim() },
  });
  revalidatePath("/einstellungen/pflichtfotos");
}

export async function deleteRequiredPhotoTypeAction(id: string) {
  await requireAuth();
  // Bereits hochgeladene Fotos bleiben erhalten und rutschen in "Weitere
  // Dokumente" (requiredPhotoTypeId wird via onDelete: SetNull geleert).
  await prisma.requiredPhotoType.delete({ where: { id } });
  revalidatePath("/einstellungen/pflichtfotos");
}

export async function moveRequiredPhotoTypeAction(
  variantType: string,
  id: string,
  direction: "up" | "down"
) {
  await requireAuth();
  const types = await prisma.requiredPhotoType.findMany({
    where: { variantType },
    orderBy: { sortOrder: "asc" },
  });
  const index = types.findIndex((t) => t.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= types.length) return;

  const a = types[index];
  const b = types[swapWith];

  await prisma.$transaction([
    prisma.requiredPhotoType.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.requiredPhotoType.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath("/einstellungen/pflichtfotos");
}
