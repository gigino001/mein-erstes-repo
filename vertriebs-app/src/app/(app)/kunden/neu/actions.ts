"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CustomerSchema = z.object({
  salutation: z.string().optional(),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  company: z.string().optional(),
  street: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  buildingType: z.string().optional(),
  buildYear: z.coerce.number().int().optional().or(z.literal("")),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormState = { error: string } | null;

export async function createCustomerAction(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const data = parsed.data;
  const customer = await prisma.customer.create({
    data: {
      salutation: data.salutation || null,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || null,
      street: data.street || null,
      postalCode: data.postalCode || null,
      city: data.city || null,
      phone: data.phone || null,
      email: data.email || null,
      buildingType: data.buildingType || null,
      buildYear: data.buildYear === "" ? null : data.buildYear,
      contactPerson: data.contactPerson || null,
      notes: data.notes || null,
      ownerId: session.user.id,
    },
  });

  redirect(`/kunden/${customer.id}`);
}
