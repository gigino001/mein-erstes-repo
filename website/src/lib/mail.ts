import "server-only";
import nodemailer from "nodemailer";
import { business, fullAddress } from "@/lib/business";
import { buildAppointmentIcs } from "@/lib/ics";

type MailAttachment = { filename: string; content: string; contentType?: string };
type MailInput = { to: string; subject: string; text: string; attachments?: MailAttachment[] };

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
export async function sendMail({ to, subject, text, attachments }: MailInput) {
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
  serviceName: string;
  startAt: Date;
  endAt: Date;
};

export async function sendNewRequestToOwner(data: AppointmentMailData) {
  await sendMail({
    to: business.email,
    subject: `Neue Terminanfrage: ${data.customerName}`,
    text: `Neue Terminanfrage über die Website:

Kundin: ${data.customerName} (${data.customerEmail})
Leistung: ${data.serviceName}
Wunschtermin: ${formatDateTime(data.startAt)}

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
Wunschtermin: ${formatDateTime(data.startAt)}

Das ist noch keine feste Zusage — ${business.owner} bestätigt deinen Termin persönlich und meldet sich zeitnah bei dir.

Bis bald,
${business.name}`,
  });
}

export async function sendAppointmentConfirmedToCustomer(data: AppointmentMailData) {
  const ics = buildAppointmentIcs({
    id: data.id,
    startAt: data.startAt,
    endAt: data.endAt,
    serviceName: data.serviceName,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
  });

  await sendMail({
    to: data.customerEmail,
    subject: `Dein Termin bei ${business.name} ist bestätigt`,
    text: `Hallo ${data.customerName},

dein Termin ist bestätigt:

Leistung: ${data.serviceName}
Termin: ${formatDateTime(data.startAt)}

${fullAddress}
${ics ? "\nIm Anhang findest du eine Kalenderdatei zum direkten Speichern in deinem Kalender (Apple Kalender, Google Kalender, Outlook usw.).\n" : ""}
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

dein Termin am ${formatDateTime(data.startAt)} (${data.serviceName}) wurde leider storniert.

Melde dich gerne, um einen neuen Termin zu vereinbaren:
Telefon: ${business.phoneDisplay}
E-Mail: ${business.email}

${business.owner}`,
  });
}
