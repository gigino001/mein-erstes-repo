import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ComponentForm } from "../component-form";
import { updateComponentAction } from "../actions";

export default async function KomponenteBearbeitenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const component = await prisma.component.findUnique({ where: { id } });
  if (!component) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={component.manufacturer ? `${component.manufacturer} ${component.name}` : component.name}
      />
      <div className="p-4 sm:p-8 max-w-2xl">
        <ComponentForm
          action={updateComponentAction.bind(null, component.id)}
          existing={component}
        />
      </div>
    </div>
  );
}
