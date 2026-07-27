import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { WizardProgress } from "@/components/wizard";
import { KLIMA_STEPS } from "../steps";
import { saveGebaeudeAction, saveRaeumeAction, saveKomponentenAction } from "../actions";
import { GebaeudeForm } from "../gebaeude-form";
import { RaeumeForm } from "../raeume-form";
import { KlimaKomponentenForm } from "../komponenten-form";
import { ErgebnisView } from "../ergebnis-view";

export default async function KlimaStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id: projectId, step } = await params;

  if (!KLIMA_STEPS.some((s) => s.slug === step)) {
    notFound();
  }

  const climaData = await prisma.climaData.findUnique({
    where: { projectId },
    include: { rooms: { orderBy: { sortOrder: "asc" } }, climaComponent: true },
  });

  if (!climaData) {
    notFound();
  }

  const basePath = `/projekte/${projectId}/klima`;
  const stepIndex = KLIMA_STEPS.findIndex((s) => s.slug === step);
  const backHref =
    stepIndex > 0 ? `${basePath}/${KLIMA_STEPS[stepIndex - 1].slug}` : `/projekte/${projectId}`;

  let content: React.ReactNode;
  switch (step) {
    case "gebaeude":
      content = (
        <GebaeudeForm
          climaData={climaData}
          action={saveGebaeudeAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "raeume":
      content = (
        <RaeumeForm
          rooms={climaData.rooms}
          action={saveRaeumeAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "komponenten": {
      const components = await prisma.component.findMany({
        where: { active: true, category: "KLIMAGERAET" },
        orderBy: [{ category: "asc" }, { manufacturer: "asc" }],
      });
      const grouped: Record<string, typeof components> = {};
      for (const c of components) {
        (grouped[c.category] ??= []).push(c);
      }
      content = (
        <KlimaKomponentenForm
          climaData={climaData}
          components={grouped}
          action={saveKomponentenAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    }
    case "ergebnis":
      content = <ErgebnisView climaData={climaData} projectId={projectId} />;
      break;
    default:
      notFound();
  }

  return (
    <div>
      <PageHeader title="Klimaanlagen-Erfassung" />
      <WizardProgress steps={KLIMA_STEPS} currentSlug={step} basePath={basePath} />
      <div className="p-4 sm:p-8 max-w-3xl">{content}</div>
    </div>
  );
}
