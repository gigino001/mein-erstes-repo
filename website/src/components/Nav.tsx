import Link from "next/link";

const links = [
  { href: "/ueber-mich", label: "Über mich" },
  { href: "/leistungen", label: "Leistungen" },
  { href: "/galerie", label: "Galerie" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Nav() {
  return (
    <header className="flex items-center justify-between px-6 py-7 md:px-18">
      <Link href="/" className="font-display text-2xl italic font-medium text-ink">
        coco lashes
      </Link>
      <nav className="hidden md:flex gap-10 text-[13px] font-semibold tracking-[0.07em] uppercase text-ink">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-ocean transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/termin"
        className="font-poster uppercase text-sm text-ink bg-coral rounded-full px-7 py-3 hover:brightness-95 transition"
      >
        Termin buchen
      </Link>
    </header>
  );
}
