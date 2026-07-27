"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { putBlob, deleteBlob } from "@/lib/blob-storage";

export async function uploadDocumentAction(
  projectId: string,
  requiredPhotoTypeId: string | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const blobKey = `${projectId}/${randomUUID()}-${file.name}`;
  await putBlob(blobKey, buffer);

  await prisma.document.create({
    data: {
      projectId,
      requiredPhotoTypeId,
      blobKey,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      uploadedById: session.user.id,
    },
  });

  revalidatePath(`/projekte/${projectId}`);
}

export async function deleteDocumentAction(projectId: string, documentId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const document = await prisma.document.delete({ where: { id: documentId } });
  await deleteBlob(document.blobKey);

  revalidatePath(`/projekte/${projectId}`);
}
