"use server";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export type CartLine = { productId: string; quantity: number };

export type ShopOrderInput = {
  items: CartLine[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  fulfillment: "pickup" | "shipping";
  shippingStreet?: string;
  shippingPostalCode?: string;
  shippingCity?: string;
  /** window.location.origin des Shops, für Stripe-Redirect-URLs. */
  origin: string;
};

export type ShopOrderResult = { ok: true; checkoutUrl: string } | { ok: false; error: string };

export async function createShopOrder(input: ShopOrderInput): Promise<ShopOrderResult> {
  const {
    items,
    customerName,
    customerEmail,
    customerPhone,
    fulfillment,
    shippingStreet,
    shippingPostalCode,
    shippingCity,
    origin,
  } = input;

  if (!customerName.trim() || !customerEmail.trim()) {
    return { ok: false, error: "Bitte gib deinen Namen und deine E-Mail-Adresse an." };
  }
  if (!items.length) {
    return { ok: false, error: "Dein Warenkorb ist leer." };
  }

  const settings = await prisma.shopSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  if (fulfillment === "shipping") {
    if (!settings.shippingEnabled) {
      return { ok: false, error: "Versand ist aktuell nicht verfügbar. Bitte wähle Abholung im Studio." };
    }
    if (!shippingStreet?.trim() || !shippingPostalCode?.trim() || !shippingCity?.trim()) {
      return { ok: false, error: "Bitte gib deine vollständige Versandadresse an." };
    }
  }

  // Preise nie vom Client übernehmen — immer serverseitig anhand der
  // aktuellen, aktiven Produkte neu berechnen.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, active: true } });
  const productById = new Map(products.map((p) => [p.id, p]));

  const orderLines: { productId: string; name: string; unitPriceCents: number; quantity: number }[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) {
      return { ok: false, error: "Ein Artikel in deinem Warenkorb ist leider nicht mehr verfügbar." };
    }
    orderLines.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
    });
  }

  const shippingCostCents = fulfillment === "shipping" ? settings.shippingCostCents : 0;

  const stripe = getStripe();
  if (!stripe) {
    return {
      ok: false,
      error: "Online-Bestellungen sind aktuell nicht verfügbar. Bitte kontaktiere uns direkt.",
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail.trim(),
    line_items: [
      ...orderLines.map((line) => ({
        price_data: {
          currency: "eur",
          unit_amount: line.unitPriceCents,
          product_data: { name: line.name },
        },
        quantity: line.quantity,
      })),
      ...(shippingCostCents > 0
        ? [
            {
              price_data: {
                currency: "eur",
                unit_amount: shippingCostCents,
                product_data: { name: "Versand" },
              },
              quantity: 1,
            },
          ]
        : []),
    ],
    success_url: `${origin}/shop/bestellung-erfolgreich`,
    cancel_url: `${origin}/shop`,
    metadata: {
      type: "shop_order",
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone?.trim() || "",
      fulfillment,
      shippingStreet: shippingStreet?.trim() || "",
      shippingPostalCode: shippingPostalCode?.trim() || "",
      shippingCity: shippingCity?.trim() || "",
      shippingCostCents: String(shippingCostCents),
      cartItems: JSON.stringify(
        orderLines.map((l) => ({ id: l.productId, n: l.name, p: l.unitPriceCents, q: l.quantity })),
      ),
    },
  });

  if (!session.url) {
    return { ok: false, error: "Bestellung konnte nicht gestartet werden. Bitte versuche es erneut." };
  }
  return { ok: true, checkoutUrl: session.url };
}
