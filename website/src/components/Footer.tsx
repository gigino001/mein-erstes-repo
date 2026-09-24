import Link from "next/link";
import { business } from "@/lib/business";

export function Footer() {
  return (
    <footer className="bg-ink px-6 md:px-18 pt-14 pb-10 flex flex-col gap-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <span className="font-display text-xl italic font-medium text-white">coco lashes</span>
        <nav className="flex gap-8 text-[13px] font-semibold tracking-[0.06em] uppercase text-[#C7D2D6]">
          <Link href="/ueber-mich" className="hover:text-white transition-colors">Über mich</Link>
          <Link href="/leistungen" className="hover:text-white transition-colors">Leistungen</Link>
          <Link href="/galerie" className="hover:text-white transition-colors">Galerie</Link>
          <Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link>
        </nav>
        <div className="flex gap-3">
          <a
            href={business.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-9 h-9 rounded-full bg-coral text-ink text-xs font-bold flex items-center justify-center"
          >
            IG
          </a>
          <a
            href={`https://wa.me/${business.phone.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="w-9 h-9 rounded-full bg-coral text-ink text-xs font-bold flex items-center justify-center"
          >
            WA
          </a>
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-4 text-xs text-[#6E828B] border-t border-white/10 pt-5">
        <span>© {new Date().getFullYear()} coco lashes</span>
        <div className="flex gap-5">
          <Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link>
        </div>
      </div>
    </footer>
  );
}
