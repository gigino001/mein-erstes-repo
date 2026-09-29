import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ShopClient } from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Shop",
  description: "Pflegeprodukte für deine Wimpernverlängerung — zur Abholung im Studio bestellen.",
  alternates: { canonical: "/shop" },
};

// Ohne dynamic würde Next.js diese Seite beim Build einmalig statisch
// vorrendern — neue/geänderte Produkte aus dem Admin-Bereich würden dann
// erst nach einem erneuten Deploy sichtbar. So wird bei jedem Aufruf frisch
// aus der Datenbank gelesen.
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.shopSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    }),
  ]);

  return (
    <div className="px-6 md:px-18 py-20 flex flex-col gap-10 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">Shop</span>
        <h1 className="font-poster uppercase text-5xl">Shop</h1>
        <p className="text-ink-soft max-w-md">
          Pflegeprodukte rund um deine Wimpernverlängerung, ausgewählt von {" "}
          {settings.shippingEnabled ? "mir — zur Abholung im Studio oder per Versand." : "mir — zur Abholung bei deinem nächsten Termin."}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-ink-muted">Hier gibt es bald Produkte zu entdecken — schau gerne später wieder vorbei.</p>
      ) : (
        <ShopClient products={products} shippingEnabled={settings.shippingEnabled} shippingCostCents={settings.shippingCostCents} />
      )}
    </div>
  );
}
