"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/app/admin/actions";

const fieldClass = "border border-sky-mist rounded-xl px-4 py-3";

export function ProductForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price.replace(",", ".")) * 100);
    if (!name.trim() || !Number.isFinite(priceCents) || priceCents <= 0) return;
    startTransition(async () => {
      await createProduct({ name, description, priceCents, imageUrl });
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-2">
        <label htmlFor="product-name" className="text-sm font-semibold">
          Name
        </label>
        <input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="product-description" className="text-sm font-semibold">
          Beschreibung (optional)
        </label>
        <textarea
          id="product-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <label htmlFor="product-price" className="text-sm font-semibold">
            Preis (€)
          </label>
          <input
            id="product-price"
            required
            inputMode="decimal"
            placeholder="12,90"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-2 flex-[2]">
          <label htmlFor="product-image" className="text-sm font-semibold">
            Bild-URL (optional)
          </label>
          <input
            id="product-image"
            placeholder="/images/shop/produkt.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="font-poster uppercase text-white bg-ocean rounded-full px-6 py-3 disabled:opacity-40 w-fit"
      >
        {pending ? "Speichert…" : "Produkt anlegen"}
      </button>
    </form>
  );
}
