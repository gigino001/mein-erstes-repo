import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { OrderStatusButton } from "@/app/admin/(dashboard)/bestellungen/OrderStatusButton";

function formatDateTime(d: Date) {
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BestellungenPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const open = orders.filter((o) => o.status === "paid");
  const completed = orders.filter((o) => o.status === "completed");

  return (
    <div className="px-6 md:px-18 py-12 flex flex-col gap-14 max-w-4xl">
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold tracking-[0.14em] uppercase text-ocean">Admin</span>
        <h1 className="font-poster uppercase text-4xl">Bestellungen</h1>
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="font-semibold text-lg">
          Offen {open.length > 0 && <span className="text-coral">({open.length})</span>}
        </h2>
        {open.length === 0 && <p className="text-sm text-ink-muted">Keine offenen Bestellungen.</p>}
        <div className="flex flex-col gap-3">
          {open.map((o) => (
            <div key={o.id} className="rounded-2xl bg-coral-soft p-5 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">
                  {o.customerName} — {formatPrice(o.totalCents)}
                </p>
                <p className="text-sm text-ink-soft">
                  {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {o.customerEmail}
                  {o.customerPhone && ` · ${o.customerPhone}`} · {formatDateTime(o.createdAt)}
                  {" · "}
                  {o.fulfillment === "shipping"
                    ? `Versand an ${o.shippingStreet}, ${o.shippingPostalCode} ${o.shippingCity}`
                    : "Abholung im Studio"}
                </p>
              </div>
              <OrderStatusButton id={o.id} />
            </div>
          ))}
        </div>
      </section>

      {completed.length > 0 && (
        <section className="flex flex-col gap-5">
          <h2 className="font-semibold text-lg text-ink-muted">Erledigt ({completed.length})</h2>
          <div className="flex flex-col divide-y divide-sky-mist opacity-60">
            {completed.slice(0, 20).map((o) => (
              <div key={o.id} className="py-3 text-sm">
                {formatDateTime(o.createdAt)} — {o.customerName} — {formatPrice(o.totalCents)}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
