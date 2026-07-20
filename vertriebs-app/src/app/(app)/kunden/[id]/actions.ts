"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createProjectAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const customerId = formData.get("customerId");
  if (typeof customerId !== "string") {
    throw new Error("customerId fehlt");
  }

  const wantsPv = formData.get("wantsPv") === "on";
  const wantsHeatPump = formData.get("wantsHeatPump") === "on";

  const project = await prisma.project.create({
    data: {
      customerId,
      ownerId: session.user.id,
      wantsPv,
      wantsHeatPump,
      pvData: wantsPv ? { create: {} } : undefined,
      heatPumpData: wantsHeatPump ? { create: {} } : undefined,
      pricing: { create: {} },
    },
  });

  redirect(`/projekte/${project.id}`);
}
