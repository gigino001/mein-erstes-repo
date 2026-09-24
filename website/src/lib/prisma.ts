import { PrismaClient } from "@/generated/prisma/client";
import { getConnectionString } from "@netlify/database";

// Verhindert im Next.js-Dev-Modus (Hot Reload) mehrfache PrismaClient-Instanzen.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Lokal/ALL-INKL: DATABASE_URL aus .env. Auf Netlify: DATABASE_URL ist nicht
// gesetzt, stattdessen liefert Netlify DB die Verbindung automatisch.
const connectionString = process.env.DATABASE_URL ?? getConnectionString();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ datasources: { db: { url: connectionString } } });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
