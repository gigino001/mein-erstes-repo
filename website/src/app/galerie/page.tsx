import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galerie",
  description: "Vorher/Nachher-Fotos und Studio-Impressionen von coco lashes in Bielefeld.",
};

const PLACEHOLDERS = Array.from({ length: 6 }, (_, i) => i + 1);

export default function GaleriePage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-12">
      <div className="flex flex-col gap-4 max-w-2xl">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Galerie
        </span>
        <h1 className="font-poster uppercase text-5xl md:text-6xl">Galerie</h1>
        <p className="text-ink-soft">
          Hier entstehen bald echte Vorher/Nachher-Fotos und Eindrücke aus dem Studio.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        {PLACEHOLDERS.map((n) => (
          <div
            key={n}
            className="aspect-square rounded-2xl bg-sky-mist flex items-center justify-center text-center p-5 text-sm text-ink-muted"
          >
            [Foto-Platzhalter {n}]
          </div>
        ))}
      </div>
    </div>
  );
}
