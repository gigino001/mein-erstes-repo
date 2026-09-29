"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProduct, toggleProductActive } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

const fieldClass = "border border-sky-mist rounded-xl px-3 py-2 text-sm";

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  active: boolean;
};

export function ProductRow({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [price, setPrice] = useState((product.priceCents / 100).toString().replace(".", ","));
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (!name.trim() || !Number.isFinite(priceCents) || priceCents <= 0) return;
    startTransition(async () => {
      await updateProduct(product.id, { name, description, priceCents, imageUrl });
      setEditing(false);
      router.refresh();
    });
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleProductActive(product.id);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="py-4 flex flex-col gap-3 max-w-md">
        <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={fieldClass} />
        <div className="flex gap-3">
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            className={`${fieldClass} w-28`}
            required
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Bild-URL"
            className={`${fieldClass} flex-1`}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold text-white bg-ocean rounded-full px-5 py-2 disabled:opacity-40"
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm font-semibold text-ink-muted"
          >
            Abbrechen
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className={product.active ? "" : "opacity-50"}>
        <p className="font-semibold">
          {product.name} — {formatPrice(product.priceCents)}
          {!product.active && <span className="text-xs font-semibold text-coral ml-2">Inaktiv</span>}
        </p>
        {product.description && <p className="text-sm text-ink-muted">{product.description}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-sm font-semibold text-ink border border-sky-mist rounded-full px-5 py-2 hover:border-ocean"
        >
          Bearbeiten
        </button>
        <button
          disabled={pending}
          onClick={handleToggle}
          className="text-sm font-semibold text-ink border border-sky-mist rounded-full px-5 py-2 disabled:opacity-40 hover:border-coral"
        >
          {product.active ? "Deaktivieren" : "Aktivieren"}
        </button>
      </div>
    </div>
  );
}
