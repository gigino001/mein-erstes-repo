import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Über mich",
  description:
    "Lerne Claudia kennen — Inhaberin von coco lashes in Bielefeld und deine Ansprechpartnerin für individuelle Wimpernverlängerungen.",
  alternates: { canonical: "/ueber-mich" },
};

export default function UeberMichPage() {
  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-14 max-w-3xl mx-auto">
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Über mich
        </span>
        <h1 className="font-display italic font-medium text-4xl md:text-5xl">Hi, ich bin Claudia.</h1>
      </div>

      <div className="relative aspect-video rounded-3xl overflow-hidden bg-coral-soft">
        <Image
          src="/images/portrait/portrait-claudia.jpg"
          alt="Claudia Gajda, Inhaberin von coco lashes Bielefeld"
          fill
          sizes="768px"
          className="object-cover object-[center_25%]"
        />
      </div>

      <div className="flex flex-col gap-6 text-lg leading-relaxed text-ink-soft">
        <p>
          Deine Ansprechpartnerin für deinen perfekten Augenaufschlag. In meinem Homestudio in
          Bielefeld biete ich dir hochwertige Wimpernverlängerungen an, die deinen individuellen
          Look unterstreichen. Ob natürlich dezent oder dramatisch voluminös — ich nehme mir Zeit
          für dich und berate dich persönlich, um deine individuellen Wünsche umzusetzen.
        </p>
        <p>
          Mit viel Liebe zum Detail, professionellen Techniken und erstklassigen Produkten sorge
          ich für langlebige Ergebnisse und den ultimativen Wohlfühlmoment. Gönn dir eine Auszeit
          vom Alltag und verlasse mein Studio mit einem frischen, selbstbewussten Gefühl und
          Wimpern, die begeistern.
        </p>
        <blockquote className="font-display italic font-medium text-2xl text-ink border-l-4 border-coral pl-6 py-1">
          „Manchmal fühl ich mich wie eine Psychologin.“
        </blockquote>
        <p>
          Viele meiner Kundinnen kommen nicht nur wegen der Wimpern wieder — sondern auch, weil
          bei mir Zeit für ein ehrliches Gespräch ist. Ob kurzer Small Talk oder tiefere
          Gedanken: Bei mir darfst du ankommen, durchatmen und einfach du sein. Am Ende zählt für
          mich nicht nur, wie deine Wimpern aussehen, sondern wie du dich fühlst, wenn du gehst.
        </p>
        <p>
          Deshalb wird jedes Set individuell mit dir besprochen und angefertigt — kein
          Fließband, kein Look von der Stange, sondern genau das, was zu dir passt.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">
          Einblicke ins Studio
        </span>
        <div className="grid grid-cols-2 gap-4">
          {[
            { src: "/images/studio/studio-1.jpg", alt: "Claudia bei der Wimpernbehandlung einer Kundin" },
            { src: "/images/studio/studio-2.jpg", alt: "Claudia setzt mit der Pinzette einzelne Wimpern an" },
            { src: "/images/studio/studio-3.jpg", alt: "Claudia konzentriert bei der Arbeit im Studio" },
            { src: "/images/studio/studio-4.jpg", alt: "Claudia bei der Wimpernverlängerung am Fensterplatz" },
          ].map((photo) => (
            <div key={photo.src} className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-coral-soft">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
