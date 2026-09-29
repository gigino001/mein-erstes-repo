"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createShopOrder } from "@/app/shop/actions";
import { formatPrice } from "@/lib/format";

const fieldClass =
  "border-2 border-ink/20 rounded-xl px-4 py-3 bg-white focus:border-ocean focus:outline-none transition-colors";

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
};

export function ShopClient({
  products,
  shippingEnabled,
  shippingCostCents,
}: {
  products: Product[];
  shippingEnabled: boolean;
  shippingCostCents: number;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<"pickup" | "shipping">("pickup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<
    { type: "idle" } | { type: "submitting" } | { type: "error"; message: string }
  >({ type: "idle" });

  function setQuantity(productId: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }));
  }

  const cartLines = useMemo(
    () =>
      products
        .map((p) => ({ product: p, quantity: quantities[p.id] ?? 0 }))
        .filter((l) => l.quantity > 0),
    [products, quantities],
  );

  const itemsTotalCents = cartLines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);
  const shippingCost = fulfillment === "shipping" ? shippingCostCents : 0;
  const totalCents = itemsTotalCents + shippingCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cartLines.length) return;
    setStatus({ type: "submitting" });
    const result = await createShopOrder({
      items: cartLines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      fulfillment,
      shippingStreet: street,
      shippingPostalCode: postalCode,
      shippingCity: city,
      origin: window.location.origin,
    });
    if (!result.ok) {
      setStatus({ type: "error", message: result.error });
      return;
    }
    window.location.href = result.checkoutUrl;
  }

  return (
    <div className="flex flex-col gap-14">
      <div className="grid sm:grid-cols-2 gap-6">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl bg-sky-mist p-5 flex flex-col gap-3">
            {product.imageUrl && (
              // Bild-URLs werden im Admin frei gepflegt — bewusst kein next/image, um keine
              // Domain-Freigabe im Next-Config zu brauchen.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full aspect-square rounded-xl object-cover bg-white"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{product.name}</p>
              {product.description && <p className="text-sm text-ink-soft mt-1">{product.description}</p>}
              <p className="font-poster uppercase text-lg text-ocean mt-2">{formatPrice(product.priceCents)}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold" htmlFor={`qty-${product.id}`}>
                Menge
              </label>
              <input
                id={`qty-${product.id}`}
                type="number"
                min={0}
                value={quantities[product.id] ?? 0}
                onChange={(e) => setQuantity(product.id, Number(e.target.value))}
                className="border-2 border-ink/20 rounded-xl px-3 py-2 w-20 bg-white focus:border-ocean focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      {cartLines.length > 0 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-md">
          <section className="flex flex-col gap-2">
            <h2 className="font-semibold text-lg">Warenkorb</h2>
            {cartLines.map((l) => (
              <div key={l.product.id} className="flex justify-between text-sm">
                <span>
                  {l.quantity}× {l.product.name}
                </span>
                <span className="font-semibold">{formatPrice(l.product.priceCents * l.quantity)}</span>
              </div>
            ))}
            {fulfillment === "shipping" && (
              <div className="flex justify-between text-sm">
                <span>Versand</span>
                <span className="font-semibold">{formatPrice(shippingCostCents)}</span>
              </div>
            )}
            <div className="flex justify-between font-poster uppercase text-lg text-ocean pt-2 border-t border-ink/10 mt-1">
              <span>Gesamt</span>
              <span>{formatPrice(totalCents)}</span>
            </div>
          </section>

          {shippingEnabled && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Wie möchtest du deine Bestellung erhalten?</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillment("pickup")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                    fulfillment === "pickup"
                      ? "bg-ocean text-white border-ocean"
                      : "bg-white text-ink border-ink/20 hover:border-ocean"
                  }`}
                >
                  Abholung im Studio
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment("shipping")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                    fulfillment === "shipping"
                      ? "bg-ocean text-white border-ocean"
                      : "bg-white text-ink border-ink/20 hover:border-ocean"
                  }`}
                >
                  Versand
                </button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="name">
                Name
              </label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" htmlFor="email">
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" htmlFor="phone">
              Telefon (optional)
            </label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
          </div>

          {fulfillment === "shipping" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="street">
                  Straße und Hausnummer
                </label>
                <input id="street" required value={street} onChange={(e) => setStreet(e.target.value)} className={fieldClass} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="postalCode">
                    PLZ
                  </label>
                  <input
                    id="postalCode"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold" htmlFor="city">
                    Stadt
                  </label>
                  <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} className={fieldClass} />
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-ink-muted">
            Mit der Bestellung akzeptierst du unsere{" "}
            <Link href="/agb" target="_blank" className="font-semibold text-ocean underline">
              AGB
            </Link>{" "}
            und{" "}
            <Link href="/datenschutz" target="_blank" className="font-semibold text-ocean underline">
              Datenschutzerklärung
            </Link>
            .
          </p>

          {status.type === "error" && <p className="text-sm text-coral font-semibold">{status.message}</p>}

          <button
            type="submit"
            disabled={status.type === "submitting"}
            className="font-poster uppercase text-lg text-white bg-ocean rounded-full px-8 py-4 disabled:opacity-40 transition self-start"
          >
            {status.type === "submitting" ? "Wird geladen…" : "Weiter zur Zahlung"}
          </button>
        </form>
      )}
    </div>
  );
}
