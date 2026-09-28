import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Vorher/Nachher-Fotos und Studio-Impressionen von coco lashes in Bielefeld.",
};

const TILES = [
  { src: "/images/lashes-photo/photo-1-sky-natural.jpg", alt: "Nahaufnahme: dezentes Wimpernset" },
  { src: "/images/lashes-photo/photo-2-coral-dramatic.jpg", alt: "Nahaufnahme: dramatisches Wimpernset" },
  { src: "/images/lashes-photo/photo-3-dark-natural.jpg", alt: "Nahaufnahme: natürliches Wimpernset" },
  { src: "/images/lashes-photo/photo-6-dark-dense.jpg", alt: "Nahaufnahme: volles Wimpernset" },
  { src: "/images/lashes-photo/photo-5-coral-natural.jpg", alt: "Nahaufnahme: klassisches Wimpernset" },
  { src: "/images/lashes-photo/photo-4-sky-dense.jpg", alt: "Nahaufnahme: Mega-Volumen-Wimpernset" },
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
          dahin ein paar Beispielbilder als Platzhalter.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {TILES.map((tile, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-sky-mist">
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="(min-width: 768px) 33vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
