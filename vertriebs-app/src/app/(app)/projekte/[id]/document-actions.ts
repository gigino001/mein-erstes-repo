"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { putBlob, deleteBlob } from "@/lib/blob-storage";
import { ALLOWED_DOCUMENT_MIME_TYPES } from "@/lib/documents";

export async function uploadDocumentAction(
  projectId: string,
  requiredPhotoTypeId: string | null,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return;
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  // Der ursprüngliche Dateiname landet nur als Anzeigefeld in der DB, nicht
  // im blobKey/Dateipfad (verhindert Path-Traversal und zu lange Dateinamen
  // im lokalen Fallback).
  const blobKey = `${projectId}/${randomUUID()}`;
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

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document || document.projectId !== projectId) return;

  await prisma.document.delete({ where: { id: documentId } });
  await deleteBlob(document.blobKey);

  revalidatePath(`/projekte/${projectId}`);
}
