import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots, slotToRange } from "@/lib/availability";
import {
  sendNewRequestToOwner,
  sendRequestReceivedToCustomer,
  sendNewOrderToOwner,
  sendOrderConfirmedToCustomer,
} from "@/lib/mail";
import { getStripe } from "@/lib/stripe";

/**
 * Legt den Termin erst an, sobald Stripe die Anzahlung tatsächlich bestätigt
 * hat (siehe requestAppointment in app/termin/actions.ts) — so entstehen nie
 * unbezahlte, slot-blockierende Anfragen.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe ist nicht konfiguriert." }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Fehlende Signatur." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signaturprüfung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const m = session.metadata;

    if (m?.type === "shop_order") {
      await handleShopOrderCompleted(session, m);
      return NextResponse.json({ received: true });
    }

    if (!m?.serviceId) return NextResponse.json({ received: true });

    const service = await prisma.service.findUnique({ where: { id: m.serviceId } });
    if (!service) return NextResponse.json({ received: true });

    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    // Letzte Verfügbarkeitsprüfung: der Slot könnte während der Zahlung
    // anderweitig vergeben worden sein — dann Anzahlung zurückerstatten statt
    // den Termin doppelt zu vergeben.
    const freshSlots = await getAvailableSlots({
      staffId: m.staffId,
      dateStr: m.date,
      durationMinutes: service.durationMinutes,
    });

    if (!freshSlots.includes(m.slot)) {
      if (paymentIntentId) {
        await stripe.refunds.create({ payment_intent: paymentIntentId });
      }
      return NextResponse.json({ received: true });
    }

    const { startAt, endAt } = slotToRange(m.date, m.slot, service.durationMinutes);
    const appointment = await prisma.appointment.create({
      data: {
        serviceId: m.serviceId,
        staffId: m.staffId,
        startAt,
        endAt,
        customerName: m.customerName,
        customerEmail: m.customerEmail,
        customerPhone: m.customerPhone,
        customerInstagram: m.customerInstagram || null,
        note: m.note || null,
        status: "requested",
        depositAmountCents: Number(m.depositAmountCents) || 0,
        stripePaymentIntentId: paymentIntentId ?? null,
      },
    });

    const mailData = {
      id: appointment.id,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerInstagram: appointment.customerInstagram,
      serviceName: service.name,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      depositAmountCents: appointment.depositAmountCents,
    };
    await Promise.all([sendNewRequestToOwner(mailData), sendRequestReceivedToCustomer(mailData)]);
  }

  return NextResponse.json({ received: true });
}

async function handleShopOrderCompleted(session: Stripe.Checkout.Session, m: Stripe.Metadata) {
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  // Stripe kann denselben Webhook-Event mehrfach zustellen — nicht doppelt anlegen.
  if (paymentIntentId) {
    const existing = await prisma.order.findFirst({ where: { stripePaymentIntentId: paymentIntentId } });
    if (existing) return;
  }

  let cartItems: { id: string; n: string; p: number; q: number }[] = [];
  try {
    cartItems = JSON.parse(m.cartItems || "[]");
  } catch {
    console.error("[stripe-webhook] Konnte cartItems nicht parsen:", m.cartItems);
    return;
  }
  if (!cartItems.length) return;

  const shippingCostCents = Number(m.shippingCostCents) || 0;
  const itemsTotalCents = cartItems.reduce((sum, i) => sum + i.p * i.q, 0);

  const order = await prisma.order.create({
    data: {
      customerName: m.customerName,
      customerEmail: m.customerEmail,
      customerPhone: m.customerPhone || null,
      fulfillment: m.fulfillment,
      shippingStreet: m.shippingStreet || null,
      shippingPostalCode: m.shippingPostalCode || null,
      shippingCity: m.shippingCity || null,
      shippingCostCents,
      itemsTotalCents,
      totalCents: itemsTotalCents + shippingCostCents,
      stripePaymentIntentId: paymentIntentId ?? null,
      items: {
        create: cartItems.map((i) => ({
          productId: i.id,
          productName: i.n,
          unitPriceCents: i.p,
          quantity: i.q,
        })),
      },
    },
    include: { items: true },
  });

  const mailData = {
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    fulfillment: order.fulfillment,
    shippingStreet: order.shippingStreet,
    shippingPostalCode: order.shippingPostalCode,
    shippingCity: order.shippingCity,
    shippingCostCents: order.shippingCostCents,
    totalCents: order.totalCents,
    items: order.items.map((i) => ({
      productName: i.productName,
      unitPriceCents: i.unitPriceCents,
      quantity: i.quantity,
    })),
  };
  await Promise.all([sendNewOrderToOwner(mailData), sendOrderConfirmedToCustomer(mailData)]);
}
