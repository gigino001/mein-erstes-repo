import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS } from "@/lib/format";
import { LeistungenGrid } from "@/components/LeistungenGrid";

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

// Zeigt pro Technik das tatsächliche Ergebnisbild (statt der generischen,
// je Kategorie wiederverwendeten Fotos) — greift für Neumodellage- UND die
// passenden Auffüll-Varianten derselben Technik.
const TECHNIQUE_IMAGES: { match: string; image: string }[] = [
  { match: "bloom eyes", image: "/images/lashes-technique/technique-bloom-eyes.jpg" },
  { match: "1:1", image: "/images/lashes-technique/technique-1-1-classic.jpg" },
  { match: "light volumen", image: "/images/lashes-technique/technique-light-volumen.jpg" },
  { match: "mega volumen", image: "/images/lashes-technique/technique-mega-volumen.jpg" },
];

function getServiceImage(
  serviceName: string,
  fallbackImages: readonly string[],
  fallbackIndex: number,
): string {
  const lowerName = serviceName.toLowerCase();
  const technique = TECHNIQUE_IMAGES.find((t) => lowerName.includes(t.match));
  return technique?.image ?? fallbackImages[fallbackIndex % fallbackImages.length];
}

export default async function LeistungenPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const categoryKeys = ["neumodellage", "auffuellen", "sonstiges"] as const;

  const categories = categoryKeys
    .map((category) => {
      const items = services.filter((s) => s.category === category);
      const style = CATEGORY_STYLE[category];
      return {
        key: category,
        label: CATEGORY_LABELS[category],
        frame: style.frame,
        items: items.map((service, i) => ({
          ...service,
          image: getServiceImage(service.name, style.images, i),
        })),
      };
    })
    .filter((category) => category.items.length > 0);

  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-16 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Leistungen &amp; Preise
        </span>
        <h1 className="font-poster uppercase text-5xl md:text-6xl">Leistungen</h1>
        <p className="text-ink-soft max-w-lg leading-relaxed">
          Jedes Set wird individuell auf dich abgestimmt. Die Preise unten sind Richtwerte —
          im persönlichen Gespräch besprechen wir, was zu dir passt. Tippe auf eine Leistung für
          mehr Details.
        </p>
      </div>

      <LeistungenGrid categories={categories} />
    </div>
  );
}
