import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDuration } from "@/lib/format";
import { business } from "@/lib/business";
import { ScrollFadeIn } from "@/components/motion/ScrollFadeIn";
import { ScrollPanRow } from "@/components/motion/ScrollPanRow";

export default async function HomePage() {
  const featuredServices = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });

  return (
    <>
      {/* HERO */}
      <section className="px-6 md:px-18 pb-20 grid md:grid-cols-[1.15fr_1fr] gap-10 md:gap-14 items-center">
        <ScrollFadeIn className="flex flex-col gap-7">
          <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
            Studio für Wimpernverlängerung · Bielefeld
          </span>
          <p className="font-poster uppercase leading-[0.9] text-[15vw] md:text-[6.2vw]">
            Augen
            <br />
            auf.
            <br />
            <span className="text-coral">Wow.</span>
          </p>
          <p className="text-lg leading-relaxed text-ink-soft max-w-md">
            Individuell besprochen, individuell angefertigt — dein Wimpernset entsteht im
            Gespräch mit mir, nicht von der Stange.
          </p>
          <div className="flex flex-wrap items-center gap-7">
            <Link
              href="/termin"
              className="text-[15px] font-bold text-white bg-ocean rounded-full px-8 py-4 hover:brightness-110 transition"
            >
              Termin buchen
            </Link>
            <Link href="/leistungen" className="text-[15px] font-semibold border-b-2 border-ink pb-0.5">
              Leistungen ansehen →
            </Link>
          </div>
        </ScrollFadeIn>
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-sky-mist">
          <Image
            src="/images/lashes-photo/photo-4-sky-dense.jpg"
            alt="Nahaufnahme: Mega-Volumen-Wimpernset"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
            priority
          />
          <span className="absolute bottom-4 left-4 text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            Beispielbild — echtes Foto folgt
          </span>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="bg-ink px-6 md:px-18 py-24 grid md:grid-cols-2 gap-14">
        <ScrollFadeIn className="flex flex-col gap-6">
          <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-coral">
            Mehr als Wimpern
          </span>
          <p className="font-display italic font-medium text-[clamp(1.75rem,4vw,2.6rem)] leading-snug text-white">
            „Manchmal fühl ich mich wie eine Psychologin.“
          </p>
          <span className="text-sm text-[#9FB0B8]">— Claudia</span>
          <p className="text-[#C7D2D6] leading-relaxed max-w-md">
            Viele meiner Kundinnen kommen nicht nur wegen der Wimpern wieder. Bei mir darfst
            du ankommen, durchatmen und ehrlich sein — und gehst mit neuem Selbstbewusstsein
            wieder raus.
          </p>
        </ScrollFadeIn>
        <ScrollFadeIn delay={0.15} className="flex flex-col gap-8 pt-2">
          {[
            { n: "01", title: "Individuelle Beratung", text: "Jedes Set wird persönlich mit dir besprochen." },
            { n: "02", title: "Zeit nur für dich", text: "Kein Zeitdruck, kein Fließband — nur du und dein Look." },
            { n: "03", title: "Kein Look von der Stange", text: "Am Ende siehst du aus wie du — nicht wie jede andere." },
          ].map((item) => (
            <div key={item.n} className="flex gap-5 border-t border-white/10 pt-6">
              <span className="font-poster text-xl text-coral">{item.n}</span>
              <div>
                <p className="font-semibold text-white mb-1">{item.title}</p>
                <p className="text-sm text-[#9FB0B8]">{item.text}</p>
              </div>
            </div>
          ))}
        </ScrollFadeIn>
      </section>

      {/* LEISTUNGEN TEASER */}
      <section className="px-6 md:px-18 py-24 flex flex-col gap-12">
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <h2 className="font-poster uppercase text-4xl md:text-5xl">Leistungen</h2>
          <Link href="/leistungen" className="text-sm font-semibold text-ocean">
            Alle Leistungen &amp; Preise ansehen →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {featuredServices.map((service, i) => (
            <ScrollFadeIn
              key={service.id}
              delay={i * 0.06}
              className={`rounded-2xl p-7 flex flex-col gap-3 ${
                service.category === "sonstiges" ? "bg-coral-soft" : "bg-sky-mist"
              }`}
            >
              <span className="font-semibold">{service.name}</span>
              <span className="text-xs text-ink-muted">{formatDuration(service.durationMinutes)}</span>
              <span className="font-poster text-2xl text-ocean">{formatPrice(service.priceCents)}</span>
            </ScrollFadeIn>
          ))}
        </div>
      </section>

      {/* BOLD CTA BLOCK */}
      <section className="bg-ocean px-6 md:px-18 py-20 flex flex-col md:flex-row items-center justify-between gap-8">
        <p className="font-poster uppercase text-white leading-[0.95] text-[10vw] md:text-6xl">
          Termin in
          <br />
          wenigen klicks.
        </p>
        <Link
          href="/termin"
          className="text-base font-bold text-ocean bg-white rounded-full px-9 py-4 whitespace-nowrap"
        >
          Jetzt buchen →
        </Link>
      </section>

      {/* ÜBER MICH TEASER */}
      <section className="px-6 md:px-18 py-24 grid md:grid-cols-[1fr_1.2fr] gap-14 items-center">
        <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-coral-soft">
          <Image
            src="/images/portrait/demo-portrait.jpg"
            alt="Beispielporträt (Platzhalter)"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
          />
          <span className="absolute bottom-4 left-4 text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
            Demobild — echtes Porträt folgt
          </span>
        </div>
        <ScrollFadeIn className="flex flex-col gap-6">
          <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">Über mich</span>
          <p className="font-display italic font-medium text-3xl md:text-4xl">Hi, ich bin Claudia.</p>
          <p className="text-ink-soft leading-relaxed max-w-lg">
            In meinem Homestudio biete ich dir hochwertige Wimpernverlängerungen, die deinen
            individuellen Look unterstreichen. Ob natürlich dezent oder dramatisch voluminös —
            ich nehme mir Zeit für dich und berate dich persönlich, um deine Wünsche umzusetzen.
          </p>
          <Link href="/ueber-mich" className="text-[15px] font-semibold border-b-2 border-ink w-fit pb-0.5">
            Meine Geschichte lesen →
          </Link>
        </ScrollFadeIn>
      </section>

      {/* VORHER / NACHHER — SCROLL-GEKOPPELT */}
      <section className="bg-ink flex flex-col gap-10 pt-24">
        <div className="px-6 md:px-18 flex flex-col gap-2">
          <h2 className="font-poster uppercase text-4xl md:text-5xl text-white">Vorher × Nachher</h2>
          <span className="text-xs text-[#6E828B]">
            ↳ Bewegt sich beim Scrollen von rechts nach links
          </span>
        </div>
        <ScrollPanRow>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="relative shrink-0 w-[300px] md:w-[340px] aspect-square rounded-2xl overflow-hidden bg-[#2C3B44]"
            >
              <Image
                src={n % 2 === 0 ? "/images/lashes-photo/photo-6-dark-dense.jpg" : "/images/lashes-photo/photo-3-dark-natural.jpg"}
                alt={n % 2 === 0 ? "Nahaufnahme: volles Wimpernset" : "Nahaufnahme: natürliches Wimpernset"}
                fill
                sizes="340px"
                className="object-cover"
              />
              <span className="absolute bottom-3 left-3 text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {n % 2 === 0 ? "Nachher" : "Vorher"} · Beispielbild
              </span>
            </div>
          ))}
        </ScrollPanRow>
      </section>

      {/* KUNDINNENSTIMMEN */}
      <section className="px-6 md:px-18 py-24 flex flex-col items-center gap-8 text-center">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Was Kundinnen erleben
        </span>
        <ScrollFadeIn className="max-w-2xl flex flex-col items-center gap-6">
          <p className="font-display italic font-medium text-2xl md:text-3xl leading-relaxed text-ink-muted">
            „[Platz für eine echte Kundenstimme — z. B. eine Google-Bewertung, mit
            Einverständnis der Kundin einzufügen]“
          </p>
        </ScrollFadeIn>
      </section>

      {/* KONTAKT STRIP */}
      <section className="bg-sky-mist px-6 md:px-18 py-20 grid md:grid-cols-2 gap-14">
        <div className="flex flex-col gap-5">
          <h3 className="font-poster uppercase text-3xl">Öffnungszeiten</h3>
          <div className="flex flex-col gap-2.5 text-[15px]">
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
        <div className="flex flex-col gap-5">
          <h3 className="font-poster uppercase text-3xl">Kontakt</h3>
          <div className="flex flex-col gap-2 text-[15px]">
            <span>{business.address.street}, {business.address.postalCode} {business.address.city}</span>
            <span>{business.phoneDisplay}</span>
            <span>{business.email}</span>
            <a href={business.instagramUrl} className="font-semibold text-ocean">
              @{business.instagram}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
