import type { Metadata } from "next";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description:
    "Antworten auf häufige Fragen zur Wimpernverlängerung bei coco lashes in Bielefeld: Preise, Haltbarkeit, Ablauf und Pflege.",
};

const FAQ = [
  {
    question: "Was kostet eine Wimpernverlängerung in Bielefeld bei coco lashes?",
    answer:
      "Eine Neumodellage startet bei 80 € (Classic 1:1) und geht bis 100 € (Mega Volumen), Bloom Eyes kostet 95 €. Auffülltermine liegen je nach Stil und Intervall zwischen 40 € und 70 €. Die genaue Liste findest du auf der Leistungen-Seite.",
  },
  {
    question: "Wie lange hält eine Wimpernverlängerung?",
    answer:
      "Je nach natürlichem Wachstumszyklus deiner Wimpern hält ein Set 2–4 Wochen. Danach empfiehlt sich ein Auffülltermin, um Lücken zu schließen, die durch den natürlichen Wimpernwechsel entstehen.",
  },
  {
    question: "Was ist der Unterschied zwischen Classic, Light Volumen und Mega Volumen?",
    answer:
      "Classic (1:1) setzt eine Extension pro Naturwimper für einen dezenten, natürlichen Look. Light Volumen kombiniert mehrere feine Wimpern pro Naturwimper für mehr Fülle. Mega Volumen geht noch dichter und dramatischer. Welcher Stil zu dir passt, besprechen wir individuell im Termin.",
  },
  {
    question: "Muss ich vor dem Termin etwas beachten?",
    answer:
      "Komm möglichst ohne Augen-Make-up und Kontaktlinsen zum Termin, plane für eine Neumodellage 1,5–2 Stunden ein und vermeide direkt vorher Kaffee, damit du gut entspannen kannst — die Behandlung findet mit geschlossenen Augen im Liegen statt.",
  },
  {
    question: "Wie melde ich mich als Model an?",
    answer:
      "Wenn du eine Anzeige gesehen hast, dass Models gesucht werden, kannst du die 'Modellarbeit'-Leistung direkt buchen — sie ist speziell für Übungs- und Fotomodelle zu einem reduzierten Preis gedacht.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-14 max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Häufige Fragen
        </span>
        <h1 className="font-poster uppercase text-5xl md:text-6xl">FAQ</h1>
      </div>

      <div className="flex flex-col divide-y divide-sky-mist">
        {FAQ.map((item) => (
          <div key={item.question} className="py-7 flex flex-col gap-3">
            <h2 className="font-semibold text-lg">{item.question}</h2>
            <p className="text-ink-soft leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-ink-muted">
        Noch Fragen? Schreib mir gerne direkt auf{" "}
        <a href={business.instagramUrl} className="text-ocean font-semibold">
          Instagram
        </a>{" "}
        oder per{" "}
        <a href={`mailto:${business.email}`} className="text-ocean font-semibold">
          E-Mail
        </a>
        .
      </p>
    </div>
  );
}
