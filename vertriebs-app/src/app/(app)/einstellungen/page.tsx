import Link from "next/link";
import { ChevronRight, ListChecks, BadgeEuro, ClipboardList, Camera, Landmark, BarChart3 } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PageHeader, Card } from "@/components/ui";
import { LogOutButton } from "@/components/log-out-button";

export default async function EinstellungenPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div>
      <PageHeader title="Mehr" description="Konto und Einstellungen" />
      <div className="p-4 sm:p-8 max-w-lg space-y-4">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-500">Konto</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd>{session.user.name ?? "–"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">E-Mail</dt>
              <dd>{session.user.email ?? "–"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rolle</dt>
              <dd>{session.user.role}</dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <LogOutButton />
          </div>
        </Card>

        <Link href="/einstellungen/status">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <ListChecks size={18} className="text-emerald-600" />
              Status-Workflows verwalten
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </Card>
        </Link>

        <Link href="/einstellungen/foerderungen">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <BadgeEuro size={18} className="text-emerald-600" />
              Förderprogramme verwalten
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </Card>
        </Link>

        <Link href="/aufgaben">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <ClipboardList size={18} className="text-emerald-600" />
              Aufgaben
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </Card>
        </Link>

        <Link href="/einstellungen/pflichtfotos">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <Camera size={18} className="text-emerald-600" />
              Pflichtfotos verwalten
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </Card>
        </Link>

        <Link href="/einstellungen/finanzierung">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <Landmark size={18} className="text-emerald-600" />
              Finanzierungskonditionen verwalten
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </Card>
        </Link>

        <Link href="/auswertungen">
          <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
            <span className="flex items-center gap-2.5 text-sm font-medium">
              <BarChart3 size={18} className="text-emerald-600" />
              Auswertungen
            </span>
            <ChevronRight size={16} className="text-slate-400" />
          </Card>
        </Link>
      </div>
    </div>
  );
}
