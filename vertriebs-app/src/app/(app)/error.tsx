"use client";

import { Card, Button, PageHeader } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <PageHeader title="Es ist ein Fehler aufgetreten" />
      <div className="max-w-lg p-4 sm:p-8">
        <Card>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {error.message || "Unbekannter Fehler."}
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => reset()}>
            Erneut versuchen
          </Button>
        </Card>
      </div>
    </div>
  );
}
