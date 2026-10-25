import { NavLink } from "react-router-dom";
import { cx } from "./ui";

const I = {
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  wardrobe: <path d="M12 6a2 2 0 1 1 2 2c-1 0-2 .6-2 2v1M12 11 3 17h18z" />,
  inspo: <><rect x="4" y="4" width="16" height="16" rx="1" /><path d="m4 16 5-5 4 4 2-2 5 5" /><circle cx="15" cy="9" r="1.5" /></>,
  outfits: <><rect x="4" y="3" width="7" height="8" /><rect x="13" y="3" width="7" height="8" /><rect x="4" y="13" width="7" height="8" /><rect x="13" y="13" width="7" height="8" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
};
const TABS: [string, string, keyof typeof I][] = [["/", "Heute", "home"], ["/schrank", "Schrank", "wardrobe"], ["/inspiration", "Inspiration", "inspo"], ["/outfits", "Outfits", "outfits"], ["/profil", "Profil", "profile"]];

export function Nav() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-paper px-8 py-10 lg:flex">
        <p className="font-display text-3xl italic">Fadenlauf</p>
        <p className="eyebrow mt-2">Dein KI-Stylist</p>
        <nav aria-label="Hauptnavigation" className="mt-14 flex flex-col gap-1">
          {TABS.map(([to, label, ic]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => cx("flex items-center gap-4 border-l-2 py-2.5 pl-4 text-sm font-medium tracking-wide transition-colors", isActive ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink")}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.5]" aria-hidden>{I[ic]}</svg>{label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <nav aria-label="Hauptnavigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map(([to, label, ic]) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => cx("flex flex-col items-center gap-1 py-3 text-[.62rem] font-semibold uppercase tracking-[.14em]", isActive ? "text-ink" : "text-muted")}>
              {({ isActive }) => (<><svg viewBox="0 0 24 24" className={cx("h-[22px] w-[22px] fill-none stroke-current", isActive ? "stroke-2" : "stroke-[1.5]")} aria-hidden>{I[ic]}</svg>{label}{isActive && <i className="-mb-1 h-px w-5 bg-gold" />}</>)}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
