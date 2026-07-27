import { clsx } from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export function buttonClasses(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  className?: string
) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variant === "primary" &&
      "bg-emerald-600 text-white hover:bg-emerald-700",
    variant === "secondary" &&
      "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    variant === "ghost" &&
      "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
    className
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  className,
  href,
  children,
}: {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-6 py-16 text-center">
      <p className="text-base font-medium">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// Fester Farbzyklus für die (je Auftragsvariante frei konfigurierbaren)
// Status-Schritte eines Projekts. Abgeschlossene/terminale Stati sind immer grau.
const STATUS_COLOR_CYCLE = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
];
const STATUS_TERMINAL_STYLE =
  "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

export function StatusBadge({
  name,
  sortOrder = 0,
  isTerminal = false,
}: {
  name: string;
  sortOrder?: number;
  isTerminal?: boolean;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        isTerminal
          ? STATUS_TERMINAL_STYLE
          : STATUS_COLOR_CYCLE[sortOrder % STATUS_COLOR_CYCLE.length]
      )}
    >
      {name}
    </span>
  );
}

// Fester Farbzyklus für den (fest vorgegebenen) Interessenten-Pipeline-Status des Kunden.
const pipelineStyles: Record<string, string> = {
  INTERESSENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  TERMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  ANGEBOT: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  WIEDERVORLAGE: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  KUNDE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

export function PipelineStatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        pipelineStyles[status] ?? pipelineStyles.INTERESSENT
      )}
    >
      {label}
    </span>
  );
}
