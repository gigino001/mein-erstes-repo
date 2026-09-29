"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateShopSettings } from "@/app/admin/actions";

export function ShopSettingsForm({
  shippingEnabled,
  shippingCostCents,
}: {
  shippingEnabled: boolean;
  shippingCostCents: number;
}) {
  const [enabled, setEnabled] = useState(shippingEnabled);
  const [cost, setCost] = useState((shippingCostCents / 100).toString().replace(".", ","));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const shippingCostCents = Math.round(parseFloat(cost.replace(",", ".")) * 100);
    if (!Number.isFinite(shippingCostCents) || shippingCostCents < 0) return;
    startTransition(async () => {
      await updateShopSettings({ shippingEnabled: enabled, shippingCostCents });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-sky-mist p-6 flex flex-col gap-4 max-w-md">
      <h2 className="font-semibold text-lg">Versand-Einstellungen</h2>
      <label className="flex items-start gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 w-5 h-5 shrink-0 rounded border-2 border-ink/30 accent-ocean cursor-pointer"
        />
        <span>
          Versand im Shop anbieten. <strong>Wichtig:</strong> Aktiviere das erst, wenn du die
          Widerrufsbelehrung geprüft und ggf. eine LUCID-Registrierung (Verpackungsregister)
          abgeschlossen hast — sonst nur Abholung im Studio anbieten.
        </span>
      </label>
      <div className="flex flex-col gap-2">
        <label htmlFor="shipping-cost" className="text-sm font-semibold">
          Versandkostenpauschale (€)
        </label>
        <input
          id="shipping-cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          inputMode="decimal"
          className="border border-white rounded-xl px-4 py-3 bg-white w-32"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-semibold text-white bg-ocean rounded-full px-5 py-2 disabled:opacity-40 w-fit"
      >
        {pending ? "Speichert…" : "Speichern"}
      </button>
    </form>
  );
}
