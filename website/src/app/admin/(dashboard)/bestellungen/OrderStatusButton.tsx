"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markOrderCompleted } from "@/app/admin/actions";

export function OrderStatusButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markOrderCompleted(id);
      router.refresh();
    });
  }

  return (
    <button
      disabled={pending}
      onClick={handleClick}
      className="text-sm font-semibold text-white bg-ocean rounded-full px-5 py-2 disabled:opacity-40 shrink-0"
    >
      Als erledigt markieren
    </button>
  );
}
