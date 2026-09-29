import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "@/components/ReviewForm";

export const metadata: Metadata = {
  title: "Bewertung abgeben",
  robots: { index: false, follow: false },
};

export default async function BewertungPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  const isEligible = appointment && appointment.status === "confirmed" && appointment.startAt <= new Date();

  return (
    <div className="px-6 md:px-18 py-20 max-w-xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col gap-4 text-center">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Deine Meinung zählt
        </span>
        <h1 className="font-poster uppercase text-4xl md:text-5xl">Wie war dein Termin?</h1>
      </div>

      {isEligible ? (
        <ReviewForm appointmentId={id} initialName={appointment.customerName} />
      ) : (
        <div className="rounded-2xl bg-sky-mist p-10 text-center flex flex-col gap-3">
          <p className="text-ink-soft">
            Zu diesem Link konnte leider kein passender Termin gefunden werden. Wenn du eine Bewertung
            abgeben möchtest, melde dich gerne direkt bei mir.
          </p>
          <Link href="/kontakt" className="text-sm font-semibold text-ocean underline mt-2">
            Zum Kontakt
          </Link>
        </div>
      )}
    </div>
  );
}
