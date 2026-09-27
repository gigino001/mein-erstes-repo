"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatDuration } from "@/lib/format";

type ServiceWithImage = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  priceCents: number;
  image: string;
};

type CategoryGroup = {
  key: string;
  label: string;
  frame: string;
  items: ServiceWithImage[];
};

export function LeistungenGrid({ categories }: { categories: CategoryGroup[] }) {
  const [selected, setSelected] = useState<ServiceWithImage | null>(null);

  useEffect(() => {
    if (!selected) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <>
      {categories.map((category) => (
        <div key={category.key} className={`rounded-3xl p-6 md:p-10 flex flex-col gap-7 ${category.frame}`}>
          <h2 className="font-poster uppercase text-2xl md:text-3xl text-ocean">{category.label}</h2>
          <div className="flex flex-col divide-y divide-white/60">
            {category.items.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelected(service)}
                className="flex items-center gap-5 py-5 text-left w-full hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="relative shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white/50">
                  <Image src={service.image} alt="" fill sizes="96px" className="object-cover" />
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
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-ink/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative bg-white rounded-3xl overflow-hidden w-full max-w-2xl grid md:grid-cols-[1.1fr_1fr] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Schließen"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-ink hover:bg-white transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <div className="relative aspect-square md:aspect-auto bg-sky-mist">
              <Image
                src={selected.image}
                alt={selected.name}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-7 md:p-9 flex flex-col gap-4">
              <h3 className="font-poster uppercase text-2xl md:text-3xl">{selected.name}</h3>
              {selected.description && (
                <p className="text-ink-soft leading-relaxed">{selected.description}</p>
              )}
              <div className="flex items-center gap-4">
                <span className="font-poster text-2xl text-ocean">{formatPrice(selected.priceCents)}</span>
                <span className="text-sm text-ink-muted">{formatDuration(selected.durationMinutes)}</span>
              </div>
              <Link
                href={`/termin?service=${selected.id}`}
                className="mt-2 font-poster uppercase text-center text-white bg-ocean rounded-full px-8 py-4 hover:brightness-110 transition"
              >
                Termin buchen
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
