import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Users, PlusCircle, Package, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Übersicht", icon: LayoutGrid },
  { href: "/kunden", label: "Kunden", icon: Users },
  { href: "/kunden/neu", label: "Neu", icon: PlusCircle },
  { href: "/komponenten", label: "Komponenten", icon: Package },
  { href: "/einstellungen", label: "Mehr", icon: Settings },
];
