import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Vorher/Nachher-Fotos und Studio-Impressionen von coco lashes in Bielefeld.",
};

const TILES = [
  { bg: "bg-sky-mist", src: "/images/lashes/eye-1-sky-natural.jpg", alt: "Illustration: dezentes Wimpernset" },
  { bg: "bg-coral-soft", src: "/images/lashes/eye-2-coral-dramatic.jpg", alt: "Illustration: dramatisches Wimpernset" },
  { bg: "bg-ink", src: "/images/lashes/eye-3-dark-natural.jpg", alt: "Illustration: natürliches Wimpernset" },
  { bg: "bg-ink", src: "/images/lashes/eye-6-dark-dense.jpg", alt: "Illustration: volles Wimpernset" },
  { bg: "bg-coral-soft", src: "/images/lashes/eye-5-coral-natural.jpg", alt: "Illustration: klassisches Wimpernset" },
  { bg: "bg-sky-mist", src: "/images/lashes/eye-4-sky-dense.jpg", alt: "Illustration: Mega-Volumen-Wimpernset" },
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
            <Image
              src={tile.src}
              alt={tile.alt}
              width={800}
              height={800}
              className="w-full h-auto"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
