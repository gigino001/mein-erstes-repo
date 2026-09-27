import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDuration, CATEGORY_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Leistungen & Preise",
  description:
    "Alle Wimpernverlängerungs-Leistungen von coco lashes in Bielefeld: Neumodellage, Auffülltermine und Preise im Überblick.",
};

const CATEGORY_STYLE = {
  neumodellage: {
    frame: "bg-sky-mist",
    images: [
      "/images/lashes-photo/photo-4-sky-dense.jpg",
      "/images/lashes-photo/photo-1-sky-natural.jpg",
    ],
  },
  auffuellen: {
    frame: "bg-coral-soft",
    images: [
      "/images/lashes-photo/photo-2-coral-dramatic.jpg",
      "/images/lashes-photo/photo-5-coral-natural.jpg",
    ],
  },
  sonstiges: {
    frame: "bg-berry-soft",
    images: [
      "/images/lashes-photo/photo-3-dark-natural.jpg",
      "/images/lashes-photo/photo-6-dark-dense.jpg",
    ],
  },
} as const;

export default async function LeistungenPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const categories = ["neumodellage", "auffuellen", "sonstiges"] as const;

  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-16 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Leistungen &amp; Preise
        </span>
        <h1 className="font-poster uppercase text-5xl md:text-6xl">Leistungen</h1>
        <p className="text-ink-soft max-w-lg leading-relaxed">
          Jedes Set wird individuell auf dich abgestimmt. Die Preise unten sind Richtwerte —
          im persönlichen Gespräch besprechen wir, was zu dir passt.
        </p>
      </div>

      {categories.map((category) => {
        const items = services.filter((s) => s.category === category);
        if (items.length === 0) return null;
        const style = CATEGORY_STYLE[category];
        return (
          <div key={category} className={`rounded-3xl p-6 md:p-10 flex flex-col gap-7 ${style.frame}`}>
            <h2 className="font-poster uppercase text-2xl md:text-3xl text-ocean">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="flex flex-col divide-y divide-white/60">
              {items.map((service, i) => (
                <div key={service.id} className="flex items-center gap-5 py-5">
                  <div className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white/50">
                    <Image
                      src={style.images[i % style.images.length]}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 flex items-start justify-between gap-6">
                    <div>
                      <p className="font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-ink-muted mt-1 max-w-md">{service.description}</p>
                      )}
                      <p className="text-xs text-ink-muted mt-1">{formatDuration(service.durationMinutes)}</p>
                    </div>
                    <span className="font-poster text-xl text-ocean whitespace-nowrap">
                      {formatPrice(service.priceCents)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
