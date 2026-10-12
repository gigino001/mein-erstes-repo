import type { Metadata } from "next";
import { ReviewForm } from "@/components/ReviewForm";

export const metadata: Metadata = {
  title: "Bewertung abgeben",
  description: "Teile deine Erfahrung mit coco lashes — ich freue mich über dein Feedback.",
  alternates: { canonical: "/bewertung" },
};

export default function BewertungPage() {
  return (
    <div className="px-6 md:px-18 py-20 max-w-xl mx-auto flex flex-col gap-10">
      <div className="flex flex-col gap-4 text-center">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Deine Meinung zählt
        </span>
        <h1 className="font-poster uppercase text-4xl md:text-5xl">Wie war dein Termin?</h1>
      </div>

      <ReviewForm />
    </div>
  );
}
