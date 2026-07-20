import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { WizardProgress } from "@/components/wizard";
import { WP_STEPS } from "../steps";
import {
  saveGebaeudeAction,
  saveHeizungAction,
  saveHeizkoerperAction,
  saveStandortAction,
  saveKomponentenAction,
} from "../actions";
import { GebaeudeForm } from "../gebaeude-form";
import { HeizungForm } from "../heizung-form";
import { HeizkoerperForm } from "../heizkoerper-form";
import { StandortForm } from "../standort-form";
import { WpKomponentenForm } from "../komponenten-form";
import { WpErgebnisView } from "../ergebnis-view";

export default async function WpStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id: projectId, step } = await params;

  if (!WP_STEPS.some((s) => s.slug === step)) {
    notFound();
  }

  const data = await prisma.heatPumpData.findUnique({
    where: { projectId },
    include: { heatPumpComponent: true },
  });

  if (!data) {
    notFound();
  }

  const basePath = `/projekte/${projectId}/waermepumpe`;
  const stepIndex = WP_STEPS.findIndex((s) => s.slug === step);
  const backHref =
    stepIndex > 0 ? `${basePath}/${WP_STEPS[stepIndex - 1].slug}` : `/projekte/${projectId}`;

  let content: React.ReactNode;
  switch (step) {
    case "gebaeude":
      content = (
        <GebaeudeForm
          data={data}
          action={saveGebaeudeAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "heizung":
      content = (
        <HeizungForm
          data={data}
          action={saveHeizungAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "heizkoerper":
      content = (
        <HeizkoerperForm
          data={data}
          action={saveHeizkoerperAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "standort":
      content = (
        <StandortForm
          data={data}
          action={saveStandortAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    case "komponenten": {
      const components = await prisma.component.findMany({
        where: { active: true, category: { in: ["WAERMEPUMPE", "PUFFERSPEICHER"] } },
        orderBy: [{ category: "asc" }, { manufacturer: "asc" }],
      });
      const grouped: Record<string, typeof components> = {};
      for (const c of components) {
        (grouped[c.category] ??= []).push(c);
      }
      content = (
        <WpKomponentenForm
          data={data}
          components={grouped}
          action={saveKomponentenAction.bind(null, projectId)}
          backHref={backHref}
        />
      );
      break;
    }
    case "ergebnis":
      content = <WpErgebnisView data={data} projectId={projectId} />;
      break;
    default:
      notFound();
  }

  return (
    <div>
      <PageHeader title="Wärmepumpen-Erfassung" />
      <WizardProgress steps={WP_STEPS} currentSlug={step} basePath={basePath} />
      <div className="p-4 sm:p-8 max-w-3xl">{content}</div>
    </div>
  );
}
