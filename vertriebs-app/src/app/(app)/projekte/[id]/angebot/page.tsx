import { notFound } from "next/navigation";
import { Download, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { buildOfferData } from "@/lib/offer-data";
import { PageHeader, Card, Button, EmptyState, LinkButton } from "@/components/ui";
import { labelFor, AUFTRAGSVARIANTEN } from "@/lib/options";
import { saveOfferAction } from "./actions";

function eur(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function AngebotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { variants: true },
  });
  if (!project) {
    notFound();
  }
  const hasWizardVariant = project.variants.some(
    (v) => v.variantType === "PV" || v.variantType === "WAERMEPUMPE" || v.variantType === "KLIMA"
  );

  const offerData = await buildOfferData(projectId);
  const previousOffers = await prisma.offer.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  const isReady =
    offerData &&
    (offerData.pv || offerData.heatPump || offerData.clima || offerData.salesPriceNet > 0);

  if (!offerData || !isReady) {
    return (
      <div>
        <PageHeader title="Angebot" />
        <div className="p-4 sm:p-8">
          <EmptyState
            title="Angebot noch nicht bereit"
            description={
              hasWizardVariant
                ? "Schließe zuerst die Komponentenauswahl ab, damit ein Angebot berechnet werden kann."
                : "Erfasse zuerst mindestens eine Kostenposition, damit ein Angebot berechnet werden kann."
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Angebot" description={offerData.offerNumber} />

      <div className="grid gap-6 p-4 sm:p-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {offerData.pv && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                Photovoltaik
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-400">Leistung</dt>
                  <dd className="font-medium">{offerData.pv.kwp} kWp</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Module</dt>
                  <dd className="font-medium">
                    {offerData.pv.moduleCount}x {offerData.pv.moduleLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Jahresertrag</dt>
                  <dd className="font-medium">
                    {offerData.pv.annualYieldKwh.toLocaleString("de-DE")} kWh
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Ersparnis/Jahr</dt>
                  <dd className="font-medium">{eur(offerData.pv.savingsPerYearEur)}</dd>
                </div>
              </dl>
            </Card>
          )}

          {offerData.heatPump && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                Wärmepumpe
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-400">Gerät</dt>
                  <dd className="font-medium">{offerData.heatPump.deviceLabel ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Heizlast</dt>
                  <dd className="font-medium">{offerData.heatPump.heatLoadKw} kW</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">JAZ</dt>
                  <dd className="font-medium">{offerData.heatPump.jaz}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Betriebskosten/Jahr</dt>
                  <dd className="font-medium">
                    {eur(offerData.heatPump.annualOperatingCostEur)}
                  </dd>
                </div>
              </dl>
            </Card>
          )}

          {offerData.clima && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                Klimaanlage
              </h2>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-slate-400">Gerät</dt>
                  <dd className="font-medium">{offerData.clima.deviceLabel ?? "–"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Kühllast gesamt</dt>
                  <dd className="font-medium">{offerData.clima.totalCoolingLoadKw} kW</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Inneneinheiten</dt>
                  <dd className="font-medium">{offerData.clima.recommendedUnitsCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Betriebskosten/Jahr</dt>
                  <dd className="font-medium">
                    {eur(offerData.clima.estimatedAnnualOperatingCostEur)}
                  </dd>
                </div>
              </dl>
            </Card>
          )}

          {!offerData.pv && !offerData.heatPump && !offerData.clima && (
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-slate-500">
                {project.variants
                  .map((v) => labelFor(AUFTRAGSVARIANTEN, v.variantType))
                  .join(", ")}
              </h2>
              <p className="text-sm text-slate-500">
                Angebot auf Basis der erfassten Kostenpositionen.
              </p>
            </Card>
          )}

          {previousOffers.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-semibold text-slate-500">
                Bisherige Angebote
              </h2>
              <ul className="space-y-1.5 text-sm">
                {previousOffers.map((offer) => (
                  <li key={offer.id} className="flex items-center justify-between">
                    <span>{offer.offerNumber}</span>
                    <span className="text-slate-400">
                      {new Intl.DateTimeFormat("de-DE").format(offer.createdAt)}
                    </span>
                    <span className="font-medium">{eur(offer.totalGross)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <p className="mb-1 text-xs text-slate-400">Gesamtpreis (brutto, inkl. 19% MwSt.)</p>
            <p className="mb-4 text-2xl font-semibold text-emerald-600">
              {eur(offerData.salesPriceNet * 1.19)}
            </p>
            {offerData.monthlyRate != null && (
              <p className="mb-4 text-sm text-slate-500">
                oder {eur(offerData.monthlyRate)} / Monat
              </p>
            )}

            <div className="space-y-2">
              <LinkButton
                href={`/projekte/${projectId}/angebot/pdf`}
                className="w-full"
              >
                <Download size={16} />
                PDF herunterladen
              </LinkButton>
              <form action={saveOfferAction.bind(null, projectId)}>
                <Button type="submit" variant="secondary" className="w-full">
                  <Save size={16} />
                  Angebot speichern &amp; Status setzen
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
