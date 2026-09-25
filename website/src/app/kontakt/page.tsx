import type { Metadata } from "next";
import { business, fullAddress } from "@/lib/business";

export const metadata: Metadata = {
  title: "Kontakt",
  description: `Kontaktiere coco lashes in Bielefeld: ${fullAddress}, ${business.phoneDisplay}, ${business.email}.`,
};

export default function KontaktPage() {
  const mapsQuery = encodeURIComponent(fullAddress);

  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-16 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Kontakt
        </span>
        <h1 className="font-poster uppercase text-5xl md:text-6xl">Kontakt</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-stretch">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-poster uppercase text-2xl mb-3">Öffnungszeiten</h2>
            <div className="flex flex-col gap-2 text-[15px]">
              {business.openingHours.map((h) => (
                <div key={h.label} className="flex justify-between max-w-xs">
                  <span>{h.label}</span>
                  <span className="font-semibold">
                    {h.opens}–{h.closes}
                  </span>
                </div>
              ))}
              <div className="flex justify-between max-w-xs">
                <span>Samstag / Sonntag</span>
                <span className="font-semibold text-ink-muted">Ruhetag</span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-poster uppercase text-2xl mb-3">Direkt erreichbar</h2>
            <div className="flex flex-col gap-2 text-[15px]">
              <a href={`tel:${business.phone}`} className="hover:text-ocean transition-colors">
                {business.phoneDisplay}
              </a>
              <a href={`mailto:${business.email}`} className="hover:text-ocean transition-colors">
                {business.email}
              </a>
              <a
                href={business.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ocean"
              >
                @{business.instagram}
              </a>
              <span>{fullAddress}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden aspect-square md:aspect-auto min-h-[320px] md:min-h-0 bg-sky-mist">
          <iframe
            title="Standort coco lashes"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
