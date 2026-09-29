// Netlify Scheduled Function: verschickt täglich die Bewertungs-Anfrage-Mail
// an Kundinnen, deren bestätigter Termin vor 2 Tagen stattgefunden hat.
//
// Bewusst mit relativen Importen statt der "@/"-Alias/"server-only"-Pfade aus
// src/lib/*, da Scheduled Functions von Netlify separat gebündelt werden und
// die tsconfig-Pfad-Auflösung dabei nicht garantiert ist — das hier lehnt sich
// eng an src/lib/prisma.ts und src/lib/mail.ts an, bleibt aber eigenständig.

import { PrismaClient } from "../../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { getConnectionString } from "@netlify/database";
import nodemailer from "nodemailer";

const BUSINESS_NAME = "coco lashes";
const BUSINESS_OWNER = "Claudia Gajda";
const BUSINESS_URL = "https://cocolashes-bielefeld.de";
const BUSINESS_EMAIL = "cocolashes-bielefeld@gmx.de";

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

async function sendReviewRequests() {
  const transport = getTransport();
  if (!transport) {
    console.log("[send-review-requests] Kein SMTP konfiguriert — übersprungen.");
    return new Response("SMTP nicht konfiguriert", { status: 200 });
  }

  const connectionString = process.env.DATABASE_URL ?? getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // Zeitfenster: Termine, deren Ende zwischen 48 und 72 Stunden zurückliegt
    // und für die noch keine Bewertungs-Mail verschickt wurde. Die 24h-Spanne
    // (statt exakt 48h) fängt einen verpassten/fehlgeschlagenen Lauf ab, ohne
    // doppelt zu verschicken (dafür sorgt reviewRequestSentAt).
    const now = Date.now();
    const windowStart = new Date(now - 72 * 60 * 60 * 1000);
    const windowEnd = new Date(now - 48 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        status: "confirmed",
        reviewRequestSentAt: null,
        endAt: { gte: windowStart, lte: windowEnd },
      },
    });

    let sent = 0;
    for (const a of appointments) {
      try {
        await transport.sendMail({
          from: process.env.MAIL_FROM || BUSINESS_EMAIL,
          to: a.customerEmail,
          subject: `Wie hat dir dein Termin bei ${BUSINESS_NAME} gefallen?`,
          text: `Hallo ${a.customerName},

ich hoffe, deine Wimpern von deinem Termin am ${formatDateTime(a.startAt)} gefallen dir noch genauso gut wie am ersten Tag!

Ich würde mich riesig über eine kurze Bewertung freuen — das hilft mir und anderen Kundinnen sehr:
${BUSINESS_URL}/bewertung/${a.id}

Vielen Dank und bis bald,
${BUSINESS_OWNER}`,
        });
        await prisma.appointment.update({
          where: { id: a.id },
          data: { reviewRequestSentAt: new Date() },
        });
        sent++;
      } catch (err) {
        console.error(`[send-review-requests] Fehler bei Termin ${a.id}:`, err);
      }
    }

    return new Response(`OK — ${sent}/${appointments.length} Bewertungs-Mail(s) verschickt.`, { status: 200 });
  } finally {
    await prisma.$disconnect();
  }
}

export default sendReviewRequests;

export const config = {
  // Täglich um 8:00 UTC (10:00 in Deutschland im Sommer, 9:00 im Winter).
  schedule: "0 8 * * *",
};
