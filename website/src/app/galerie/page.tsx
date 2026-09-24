import type { Metadata } from "next";
import { EyeIllustration } from "@/components/art/EyeIllustration";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Vorher/Nachher-Fotos und Studio-Impressionen von coco lashes in Bielefeld.",
};

const TILES = [
  { bg: "bg-sky-mist", stroke: "#16232B", dense: false },
  { bg: "bg-coral-soft", stroke: "#16232B", dense: true },
  { bg: "bg-ink", stroke: "#EAF4F8", dense: false },
  { bg: "bg-ink", stroke: "#EAF4F8", dense: true },
  { bg: "bg-coral-soft", stroke: "#16232B", dense: false },
  { bg: "bg-sky-mist", stroke: "#16232B", dense: true },
];

export default function GaleriePage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-12">
      <div className="flex flex-col gap-4 max-w-2xl">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Galerie
        </span>
        <h1 className="font-poster uppercase text-5xl md:text-6xl">Galerie</h1>
        <p className="text-ink-soft">
          Hier entstehen bald echte Vorher/Nachher-Fotos und Eindrücke aus dem Studio — bis
          dahin ein paar Illustrationen als Platzhalter.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {TILES.map((tile, i) => (
          <div
            key={i}
            className={`aspect-square rounded-2xl ${tile.bg} flex items-center justify-center p-8`}
          >
            <EyeIllustration dense={tile.dense} stroke={tile.stroke} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
