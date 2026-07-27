"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createTaskAction(projectId: string | null, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const title = str(formData, "title");
  if (!title) return;

  const dueDateRaw = str(formData, "dueDate");
  const resolvedProjectId = projectId ?? str(formData, "projectId");

  await prisma.task.create({
    data: {
      title,
      description: str(formData, "description"),
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      assignedToId: str(formData, "assignedToId") ?? session.user.id,
      createdById: session.user.id,
      projectId: resolvedProjectId,
    },
  });

  revalidatePath("/aufgaben");
  revalidatePath("/");
  if (resolvedProjectId) revalidatePath(`/projekte/${resolvedProjectId}`);
}

export async function toggleTaskStatusAction(taskId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { status: task.status === "ERLEDIGT" ? "OFFEN" : "ERLEDIGT" },
  });

  revalidatePath("/aufgaben");
  revalidatePath("/");
  if (task.projectId) revalidatePath(`/projekte/${task.projectId}`);
}

export async function deleteTaskAction(taskId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const task = await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/aufgaben");
  revalidatePath("/");
  if (task.projectId) revalidatePath(`/projekte/${task.projectId}`);
}
