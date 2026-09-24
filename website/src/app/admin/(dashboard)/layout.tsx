import Link from "next/link";
import { verifyAdminSession } from "@/lib/dal";
import { logout } from "@/app/admin/actions";

export default async function AdminDashboardLayout({ children }: LayoutProps<"/admin">) {
  await verifyAdminSession();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 md:px-18 py-6 border-b border-sky-mist">
        <div className="flex items-center gap-8">
          <span className="font-display italic font-medium text-xl text-ink">coco lashes</span>
          <nav className="flex gap-6 text-[13px] font-semibold tracking-[0.06em] uppercase">
            <Link href="/admin" className="hover:text-ocean transition-colors">
              Termine
            </Link>
            <Link href="/admin/blockieren" className="hover:text-ocean transition-colors">
              Zeiten blockieren
            </Link>
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm font-semibold text-ink-muted hover:text-ocean transition-colors">
            Abmelden
          </button>
        </form>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
