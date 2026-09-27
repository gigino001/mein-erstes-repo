import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Anzahlung erfolgreich",
  robots: { index: false, follow: false },
};

export default function AnzahlungErfolgreichPage() {
  return (
    <div className="px-6 md:px-18 py-20 max-w-xl mx-auto">
      <div className="rounded-2xl bg-sky-mist p-10 text-center flex flex-col gap-3">
        <p className="font-poster uppercase text-3xl text-ocean">Danke!</p>
        <p className="text-ink-soft">
          Deine Anzahlung ist eingegangen und deine Terminanfrage wurde übermittelt. Ich melde
          mich zeitnah bei dir, um sie zu bestätigen.
        </p>
        <Link href="/" className="text-sm font-semibold text-ocean underline mt-2">
          Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
