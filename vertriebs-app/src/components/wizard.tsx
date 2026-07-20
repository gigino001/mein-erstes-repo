import Link from "next/link";
import { Check } from "lucide-react";
import { clsx } from "clsx";

export type WizardStepDef = { slug: string; label: string };

export function WizardProgress({
  steps,
  currentSlug,
  basePath,
}: {
  steps: WizardStepDef[];
  currentSlug: string;
  basePath: string;
}) {
  const currentIndex = steps.findIndex((s) => s.slug === currentSlug);

  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 sm:px-8">
      <ol className="flex items-center gap-1 overflow-x-auto sm:gap-2">
        {steps.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <li key={step.slug} className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Link
                href={`${basePath}/${step.slug}`}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap sm:px-3 sm:text-sm",
                  isCurrent &&
                    "bg-emerald-600 text-white",
                  isDone && !isCurrent &&
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
                  !isCurrent && !isDone &&
                    "text-slate-400"
                )}
              >
                {isDone ? (
                  <Check size={14} />
                ) : (
                  <span
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded-full text-[10px] sm:h-5 sm:w-5",
                      isCurrent ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
                {step.label}
              </Link>
              {index < steps.length - 1 && (
                <span className="h-px w-3 bg-[var(--border)] sm:w-6" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WizardActions({
  backHref,
  nextLabel = "Weiter",
  isPending,
}: {
  backHref?: string;
  nextLabel?: string;
  isPending?: boolean;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {backHref ? (
        <Link
          href={backHref}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Zurück
        </Link>
      ) : (
        <span />
      )}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {isPending ? "Speichern…" : nextLabel}
      </button>
    </div>
  );
}
