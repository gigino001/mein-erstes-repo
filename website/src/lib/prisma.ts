import { PrismaClient } from "@/generated/prisma/client";

// Verhindert im Next.js-Dev-Modus (Hot Reload) mehrfache PrismaClient-Instanzen.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
