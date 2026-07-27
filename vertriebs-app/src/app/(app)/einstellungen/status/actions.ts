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

export async function createStatusAction(variantType: string, formData: FormData) {
  await requireAuth();
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;

  const maxSortOrder = await prisma.statusDefinition.aggregate({
    where: { variantType },
    _max: { sortOrder: true },
  });

  await prisma.statusDefinition.create({
    data: {
      variantType,
      name: name.trim(),
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });
  revalidatePath("/einstellungen/status");
}

export async function renameStatusAction(statusId: string, formData: FormData) {
  await requireAuth();
  const name = formData.get("name");
  if (typeof name !== "string" || !name.trim()) return;
  const isTerminal = formData.get("isTerminal") === "on";

  await prisma.statusDefinition.update({
    where: { id: statusId },
    data: { name: name.trim(), isTerminal },
  });
  revalidatePath("/einstellungen/status");
}

export async function deleteStatusAction(statusId: string) {
  await requireAuth();
  const inUse = await prisma.projectVariant.count({ where: { statusId } });
  if (inUse > 0) {
    throw new Error(
      `Status kann nicht gelöscht werden: ${inUse} Leistung(en) nutzen ihn noch.`
    );
  }
  await prisma.statusDefinition.delete({ where: { id: statusId } });
  revalidatePath("/einstellungen/status");
}

export async function moveStatusAction(
  variantType: string,
  statusId: string,
  direction: "up" | "down"
) {
  await requireAuth();
  const statuses = await prisma.statusDefinition.findMany({
    where: { variantType },
    orderBy: { sortOrder: "asc" },
  });
  const index = statuses.findIndex((s) => s.id === statusId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= statuses.length) return;

  const a = statuses[index];
  const b = statuses[swapWith];

  await prisma.$transaction([
    prisma.statusDefinition.update({
      where: { id: a.id },
      data: { sortOrder: b.sortOrder },
    }),
    prisma.statusDefinition.update({
      where: { id: b.id },
      data: { sortOrder: a.sortOrder },
    }),
  ]);
  revalidatePath("/einstellungen/status");
}
