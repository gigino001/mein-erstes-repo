import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type ImportItem = {
  name: string;
  longDescription: string | null;
  price: number;
  vatRatePercent: number;
  unit: string;
  productNumber: string | null;
  category: string;
  manufacturer: string;
};

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL ist nicht gesetzt");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const dataPath = join(__dirname, "data", "rechnungsartikel.json");
  const items: ImportItem[] = JSON.parse(readFileSync(dataPath, "utf-8"));

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const existing = await prisma.component.findFirst({ where: { name: item.name } });

    const data = {
      category: item.category,
      manufacturer: item.manufacturer,
      name: item.name,
      longDescription: item.longDescription,
      price: item.price,
      unit: item.unit,
      productNumber: item.productNumber,
      vatRatePercent: item.vatRatePercent,
    };

    if (existing) {
      await prisma.component.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.component.create({ data });
      created++;
    }
  }

  console.log(`Produktimport: ${created} neu, ${updated} aktualisiert (${items.length} gesamt).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
