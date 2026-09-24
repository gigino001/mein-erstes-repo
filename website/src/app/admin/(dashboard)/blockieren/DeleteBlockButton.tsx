"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteBlock } from "@/app/admin/actions";

export function DeleteBlockButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await deleteBlock(id); router.refresh(); })}
      className="text-sm font-semibold text-ink-muted hover:text-coral disabled:opacity-40"
    >
      Entfernen
    </button>
  );
}
