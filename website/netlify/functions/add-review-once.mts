// Einmalige Admin-Funktion: fügt eine von Claudia per Hand übermittelte
// (bereits freigegebene) Bewertung direkt in die DB ein, ohne den
// Freischalten-Mail-Workflow für echte Kundinnen-Einreichungen zu
// durchlaufen. Durch SESSION_SECRET als Shared Secret geschützt und nach
// einmaligem Aufruf wieder aus dem Repo entfernt.

import { PrismaClient } from "../../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { getConnectionString } from "@netlify/database";
import { randomBytes } from "node:crypto";

export default async (req: Request) => {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== process.env.SESSION_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const connectionString = process.env.DATABASE_URL ?? getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const review = await prisma.review.create({
    data: {
      customerName: "Elena",
      rating: 5,
      text: "Claudia, Vielen lieben Dank für die schönen Wimpern. Ich bin absolut begeistert! Danke!",
      status: "approved",
      token: randomBytes(24).toString("hex"),
      approvedAt: new Date(),
    },
  });

  return new Response(JSON.stringify({ ok: true, id: review.id }), {
    headers: { "content-type": "application/json" },
  });
};
