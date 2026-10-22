import "server-only";
import nodemailer from "nodemailer";
import { business, fullAddress } from "@/lib/business";
import { buildAppointmentIcs } from "@/lib/ics";

type MailAttachment = { filename: string; content: string; contentType?: string };
type MailInput = { to: string; subject: string; text: string; html?: string; attachments?: MailAttachment[] };

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/**
 * Verschickt eine Mail über SMTP (siehe .env.example für die ALL-INKL-Werte).
 * Ist noch kein SMTP eingerichtet (z. B. lokale Entwicklung), wird die Mail
 * nur in die Konsole geloggt statt zu scheitern — die Terminbuchung selbst
 * soll nie an einer fehlenden Mail-Konfiguration scheitern.
 */
export async function sendMail({ to, subject, text, html, attachments }: MailInput) {
  const transport = getTransport();

  if (!transport) {
    const attachmentDump = attachments?.length
      ? `\n--- Anhang: ${attachments[0].filename} ---\n${attachments[0].content}`
      : "";
    console.log(`[mail:dev] An ${to} — „${subject}“\n${text}${attachmentDump}\n`);
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || business.email,
      to,
      subject,
      text,
      html,
      attachments,
    });
  } catch (err) {
    // Mailversand ist "best effort": ein SMTP-Ausfall darf die Buchung/den
    // Admin-Vorgang nicht blockieren, wird aber geloggt.
    console.error("[mail] Versand fehlgeschlagen:", err);
  }
}

function formatDateTime(d: Date) {
  return d.toLocaleString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type AppointmentMailData = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerInstagram?: string | null;
  serviceName: string;
  startAt: Date;
  endAt: Date;
  depositAmountCents?: number;
  depositRefunded?: boolean;
};

function formatEuro(cents: number) {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export async function sendNewRequestToOwner(data: AppointmentMailData) {
  await sendMail({
    to: "buchung@coco-lashes.de",
    subject: `Neue Terminanfrage: ${data.customerName}`,
    text: `Neue Terminanfrage über die Website:

Kundin: ${data.customerName} (${data.customerEmail})${data.customerInstagram ? `\nInstagram: ${data.customerInstagram}` : ""}
Leistung: ${data.serviceName}
Wunschtermin: ${formatDateTime(data.startAt)}${data.depositAmountCents ? `\nAnzahlung: ${formatEuro(data.depositAmountCents)} (bereits über Stripe bezahlt)` : ""}

Bestätigen oder absagen: ${business.url}/admin`,
  });
}

export async function sendRequestReceivedToCustomer(data: AppointmentMailData) {
  await sendMail({
    to: data.customerEmail,
    subject: `Deine Terminanfrage bei ${business.name}`,
    text: `Hallo ${data.customerName},

danke für deine Terminanfrage bei ${business.name}!

Leistung: ${data.serviceName}
Wunschtermin: ${formatDateTime(data.startAt)}${data.depositAmountCents ? `\nAnzahlung: ${formatEuro(data.depositAmountCents)} (bereits bezahlt, wird mit dem Gesamtpreis verrechnet)` : ""}

Das ist noch keine feste Zusage — ${business.owner} bestätigt deinen Termin persönlich und meldet sich zeitnah bei dir.

Bis bald,
${business.name}`,
  });
}

export async function sendAppointmentConfirmedToCustomer(data: AppointmentMailData & { cancelToken: string }) {
  const ics = buildAppointmentIcs({
    id: data.id,
    startAt: data.startAt,
    endAt: data.endAt,
    serviceName: data.serviceName,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
  });
  const cancelUrl = `${business.url}/termin/stornieren/${data.cancelToken}`;

  await sendMail({
    to: data.customerEmail,
    subject: `Dein Termin bei ${business.name} ist bestätigt`,
    text: `Hallo ${data.customerName},

dein Termin ist bestätigt:

Leistung: ${data.serviceName}
Termin: ${formatDateTime(data.startAt)}

${fullAddress}
${ics ? "\nIm Anhang findest du eine Kalenderdatei zum direkten Speichern in deinem Kalender (Apple Kalender, Google Kalender, Outlook usw.).\n" : ""}
Kannst du doch nicht, kannst du den Termin hier selbst stornieren (mindestens 24 Stunden vorher, siehe AGB):
${cancelUrl}

Ich freue mich auf dich!
${business.owner}`,
    attachments: ics
      ? [{ filename: ics.filename, content: ics.content, contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
      : undefined,
  });
}

export async function sendAppointmentCancelledToCustomer(data: AppointmentMailData) {
  await sendMail({
    to: data.customerEmail,
    subject: `Dein Termin bei ${business.name} wurde storniert`,
    text: `Hallo ${data.customerName},

dein Termin am ${formatDateTime(data.startAt)} (${data.serviceName}) wurde leider storniert.${
      data.depositAmountCents
        ? data.depositRefunded
          ? `\n\nDeine Anzahlung von ${formatEuro(data.depositAmountCents)} wurde automatisch zurückerstattet und sollte in wenigen Tagen auf deinem Konto sein.`
          : `\n\nDa die Stornierung weniger als 24 Stunden vor dem Termin erfolgt ist, verfällt deine Anzahlung von ${formatEuro(data.depositAmountCents)} gemäß unseren AGB (siehe ${business.url}/agb).`
        : ""
    }

Melde dich gerne, um einen neuen Termin zu vereinbaren:
Telefon: ${business.phoneDisplay}
E-Mail: ${business.email}

${business.owner}`,
  });
}

export async function sendCustomerCancelledNotificationToOwner(data: AppointmentMailData) {
  await sendMail({
    to: "buchung@coco-lashes.de",
    subject: `Kundin hat ihren Termin storniert: ${data.customerName}`,
    text: `${data.customerName} hat ihren Termin selbst über den Stornierungslink storniert:

Leistung: ${data.serviceName}
Termin war: ${formatDateTime(data.startAt)}${
      data.depositAmountCents
        ? data.depositRefunded
          ? `\nAnzahlung von ${formatEuro(data.depositAmountCents)} wurde automatisch zurückerstattet (mehr als 24 Std. vor dem Termin).`
          : `\nAnzahlung von ${formatEuro(data.depositAmountCents)} verfällt gemäß AGB (weniger als 24 Std. vor dem Termin).`
        : ""
    }

Der Slot ist jetzt wieder frei buchbar.`,
  });
}

export async function sendReviewRequestToCustomer(data: AppointmentMailData) {
  await sendMail({
    to: data.customerEmail,
    subject: `Wie hat dir dein Termin bei ${business.name} gefallen?`,
    text: `Hallo ${data.customerName},

ich hoffe, deine Wimpern von deinem Termin am ${formatDateTime(data.startAt)} gefallen dir noch genauso gut wie am ersten Tag!

Ich würde mich riesig über eine kurze Bewertung freuen — das hilft mir und anderen Kundinnen sehr:
${business.url}/bewertung/${data.id}

Vielen Dank und bis bald,
${business.owner}`,
  });
}

type OrderMailData = {
  id: string;
  customerName: string;
  customerEmail: string;
  fulfillment: string;
  shippingStreet?: string | null;
  shippingPostalCode?: string | null;
  shippingCity?: string | null;
  shippingCostCents: number;
  totalCents: number;
  items: { productName: string; unitPriceCents: number; quantity: number }[];
};

function formatOrderItems(items: OrderMailData["items"]) {
  return items.map((i) => `${i.quantity}× ${i.productName} — ${formatEuro(i.unitPriceCents * i.quantity)}`).join("\n");
}

function formatFulfillment(data: OrderMailData) {
  if (data.fulfillment === "shipping") {
    return `Versand an:\n${data.customerName}\n${data.shippingStreet}\n${data.shippingPostalCode} ${data.shippingCity}\n(Versandkosten: ${formatEuro(data.shippingCostCents)})`;
  }
  return "Abholung im Studio";
}

export async function sendNewOrderToOwner(data: OrderMailData) {
  await sendMail({
    to: business.email,
    subject: `Neue Shop-Bestellung: ${data.customerName}`,
    text: `Neue, bezahlte Bestellung über die Website:

Kundin: ${data.customerName} (${data.customerEmail})

${formatOrderItems(data.items)}

Gesamt: ${formatEuro(data.totalCents)}

${formatFulfillment(data)}

Verwalten: ${business.url}/admin/bestellungen`,
  });
}

export async function sendOrderConfirmedToCustomer(data: OrderMailData) {
  await sendMail({
    to: data.customerEmail,
    subject: `Deine Bestellung bei ${business.name}`,
    text: `Hallo ${data.customerName},

danke für deine Bestellung bei ${business.name}! Deine Zahlung ist eingegangen.

${formatOrderItems(data.items)}

Gesamt: ${formatEuro(data.totalCents)}

${
  data.fulfillment === "shipping"
    ? `Wir verschicken deine Bestellung in den nächsten Tagen an:\n${data.shippingStreet}\n${data.shippingPostalCode} ${data.shippingCity}`
    : `Du kannst deine Bestellung bei deinem nächsten Besuch im Studio abholen (${fullAddress}).`
}

Bis bald,
${business.owner}`,
  });
}

// Für die Freischalten-/Ablehnen-Links in der Benachrichtigungs-Mail. Die
// Website lief früher unter dieser Domain (siehe business.url) — die Links
// hier zeigen bewusst direkt auf die aktuell echte, live geschaltete Domain.
const REVIEW_MODERATION_URL = "https://coco-lashes.de";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendReviewToOwner(data: {
  customerName: string;
  rating: number;
  text: string;
  token: string;
  appointmentId?: string;
}) {
  const source = data.appointmentId
    ? "Über den persönlichen Bewertungslink nach einem Termin"
    : "Über den allgemeinen Bewertungslink (/bewertung)";

  const freischaltenUrl = `${REVIEW_MODERATION_URL}/api/bewertungen/freischalten?token=${data.token}`;
  const ablehnenUrl = `${REVIEW_MODERATION_URL}/api/bewertungen/ablehnen?token=${data.token}`;
  const stars = `${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}`;

  await sendMail({
    to: "info@coco-lashes.de",
    subject: `Neue Bewertung von ${data.customerName} (${data.rating}/5 Sternen)`,
    text: `${source} wurde eine neue Bewertung abgegeben:

Von: ${data.customerName}
Bewertung: ${stars} (${data.rating}/5)

„${data.text}“

Freischalten (erscheint dann auf der Website): ${freischaltenUrl}
Ablehnen (wird endgültig gelöscht): ${ablehnenUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #16232b;">
        <p>${source} wurde eine neue Bewertung abgegeben:</p>
        <div style="background: #f3e3e0; border-radius: 16px; padding: 20px 24px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">${escapeHtml(data.customerName)}</p>
          <p style="margin: 0 0 12px; color: #a8475a; font-size: 20px; letter-spacing: 2px;">${stars}</p>
          <p style="margin: 0; white-space: pre-wrap;">„${escapeHtml(data.text)}“</p>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
          <tr>
            <td style="padding-right: 12px;">
              <a href="${freischaltenUrl}" style="display: inline-block; background: #ff9398; color: #16232b; text-decoration: none; font-weight: bold; padding: 14px 24px; border-radius: 999px;">
                ✓ Freischalten
              </a>
            </td>
            <td>
              <a href="${ablehnenUrl}" style="display: inline-block; background: #eddce2; color: #16232b; text-decoration: none; font-weight: bold; padding: 14px 24px; border-radius: 999px;">
                ✕ Ablehnen
              </a>
            </td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #6b7e87;">
          „Freischalten“ veröffentlicht die Bewertung direkt auf der Website.
          „Ablehnen“ löscht sie endgültig.
        </p>
      </div>
    `,
  });
}

/**
 * Freitext-Mail (z. B. Rabattaktion) an eine einzelne Kundin aus dem
 * Kontakte-Admin. Anders als sendMail() gibt diese Funktion den Erfolg pro
 * Empfängerin zurück, damit das Admin-UI nach einem Massenversand anzeigen
 * kann, wie viele Mails tatsächlich zugestellt wurden.
 */
export async function sendMarketingMailToCustomer(data: {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const firstName = data.customerName.trim().split(/\s+/)[0] || data.customerName;
  const text = `Hallo ${firstName},

${data.message}

Liebe Grüße
${business.owner}
${business.name}`;

  const transport = getTransport();
  if (!transport) {
    console.log(`[mail:dev] An ${data.customerEmail} — „${data.subject}“\n${text}\n`);
    return true;
  }

  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM || business.email,
      to: data.customerEmail,
      subject: data.subject,
      text,
    });
    return true;
  } catch (err) {
    console.error(`[mail] Marketing-Mail an ${data.customerEmail} fehlgeschlagen:`, err);
    return false;
  }
}
