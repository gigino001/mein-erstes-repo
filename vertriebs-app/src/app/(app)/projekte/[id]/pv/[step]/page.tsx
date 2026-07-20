import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { WizardProgress } from "@/components/wizard";
import { PV_STEPS } from "../steps";
import {
  saveDachAction,
  saveVerbrauchAction,
  saveNetzWunschAction,
  saveKomponentenAction,
} from "../actions";
import { DachForm } from "../dach-form";
import { VerbrauchForm } from "../verbrauch-form";
import { NetzWunschForm } from "../netz-wunsch-form";
import { KomponentenForm } from "../komponenten-form";
import { ErgebnisView } from "../ergebnis-view";

export default async function PvStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id: projectId, step } = await params;

  if (!PV_STEPS.some((s) => s.slug === step)) {
    notFound();
  }

  const pvData = await prisma.pvData.findUnique({
    where: { projectId },
    include: {
      roofSurfaces: { orderBy: { sortOrder: "asc" } },
      moduleComponent: true,
    },
  });

  if (!pvData) {
    notFound();
  }

  const basePath = `/projekte/${projectId}/pv`;
  const stepIndex = PV_STEPS.findIndex((s) => s.slug === step);
  const backHref =
    stepIndex > 0 ? `${basePath}/${PV_STEPS[stepIndex - 1].slug}` : `/projekte/${projectId}`;

  let content: React.ReactNode;
  switch (step) {
    case "dach":
      content = (
        <DachForm
          roofMaterial={pvData.roofMaterial}
          roofSurfaces={pvData.roofSurfaces}
          action={saveDachAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "verbrauch":
      content = (
        <VerbrauchForm
          pvData={pvData}
          action={saveVerbrauchAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "netz-wunsch":
      content = (
        <NetzWunschForm
          pvData={pvData}
          action={saveNetzWunschAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "komponenten": {
      const components = await prisma.component.findMany({
        where: { active: true },
        orderBy: [{ category: "asc" }, { manufacturer: "asc" }],
      });
      const grouped: Record<string, typeof components> = {};
      for (const c of components) {
        (grouped[c.category] ??= []).push(c);
      }
      content = (
        <KomponentenForm
          pvData={pvData}
          components={grouped}
          action={saveKomponentenAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    }
    case "ergebnis":
      content = <ErgebnisView pvData={pvData} projectId={projectId} />;
      break;
    default:
      notFound();
  }

  return (
    <div>
      <PageHeader title="Photovoltaik-Erfassung" />
      <WizardProgress steps={PV_STEPS} currentSlug={step} basePath={basePath} />
      <div className="p-4 sm:p-8 max-w-3xl">{content}</div>
    </div>
  );
}
