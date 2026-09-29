import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/app/admin/(dashboard)/produkte/ProductForm";
import { ProductRow } from "@/app/admin/(dashboard)/produkte/ProductRow";
import { ShopSettingsForm } from "@/app/admin/(dashboard)/produkte/ShopSettingsForm";

export default async function ProdukteePage() {
  const [products, settings] = await Promise.all([
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.shopSettings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  return (
    <div className="px-6 md:px-18 py-12 flex flex-col gap-14 max-w-4xl">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">Admin</span>
        <h1 className="font-poster uppercase text-4xl">Shop-Produkte</h1>
      </div>

      <ShopSettingsForm shippingEnabled={settings.shippingEnabled} shippingCostCents={settings.shippingCostCents} />

      <section className="flex flex-col gap-5">
        <h2 className="font-semibold text-lg">Neues Produkt</h2>
        <ProductForm />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-semibold text-lg">Vorhandene Produkte {products.length > 0 && `(${products.length})`}</h2>
        {products.length === 0 && <p className="text-sm text-ink-muted">Noch keine Produkte angelegt.</p>}
        <div className="flex flex-col divide-y divide-sky-mist">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
