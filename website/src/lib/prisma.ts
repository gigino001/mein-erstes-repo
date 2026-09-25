import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getConnectionString } from "@netlify/database";

// Verhindert im Next.js-Dev-Modus (Hot Reload) mehrfache PrismaClient-Instanzen.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lazy statt beim Modul-Import ausgewertet: In Netlify Functions ist die
// Umgebung (NETLIFY_DB_URL via @netlify/database) beim Cold-Start-Import
// mancher Bundles noch nicht vollständig gesetzt. Wird die Verbindung erst
// bei der ersten echten Anfrage aufgelöst, landet ein Fehler dabei in einem
// try/catch der Route statt das ganze Modul (und damit die Funktion) beim
// Import abstürzen zu lassen.
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL ?? getConnectionString();
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});
