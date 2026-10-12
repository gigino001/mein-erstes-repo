import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Vorher/Nachher-Fotos und Studio-Impressionen von coco lashes in Bielefeld.",
  alternates: { canonical: "/galerie" },
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
          Ein echtes Vorher/Nachher-Beispiel sowie ein paar Eindrücke aus dem Studio als
          Beispielbilder.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Vorher / Nachher
        </span>
        <div className="grid grid-cols-2 gap-5 max-w-2xl">
          <div className="flex flex-col gap-2">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-sky-mist">
              <Image
                src="/images/vorher-nachher/vorher-1.jpg"
                alt="Vorher: Augen ohne Wimpernverlängerung"
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
            <span className="text-center text-sm font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Vorher
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-sky-mist">
              <Image
                src="/images/vorher-nachher/nachher-1.jpg"
                alt="Nachher: Augen mit Wimpernverlängerung von coco lashes"
                fill
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
            <span className="text-center text-sm font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Nachher
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Beispielbilder
        </span>
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
    </div>
  );
}
