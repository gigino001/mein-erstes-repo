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
  specs?: Record<string, number>;
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
      specs: JSON.stringify(item.specs ?? {}),
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

  // Demo-Komponenten aus der ersten Inbetriebnahme entfernen, jetzt durch den
  // echten Produktkatalog ersetzt. Ist eine Demo-Komponente bereits in einem
  // Vorgang ausgewählt, wird sie stattdessen nur deaktiviert statt gelöscht.
  const demoComponents = [
    { manufacturer: "Jinko Solar", name: "Tiger Neo 440" },
    { manufacturer: "Meyer Burger", name: "White 400" },
    { manufacturer: "Huawei", name: "SUN2000-8KTL" },
    { manufacturer: "SMA", name: "Sunny Tripower 10.0" },
    { manufacturer: "BYD", name: "Battery-Box Premium HVS 10.2" },
    { manufacturer: "KEBA", name: "KeContact P30" },
    { manufacturer: "Fronius", name: "Smart Meter + Ohmpilot" },
    { manufacturer: "K2 Systems", name: "Dome 6 Schrägdach" },
    { manufacturer: "Vaillant", name: "aroTHERM plus 7 kW" },
    { manufacturer: "Viessmann", name: "Vitocal 250-A 10 kW" },
    { manufacturer: "Viessmann", name: "Vitocell 100-E 300L" },
  ];

  let removed = 0;
  let deactivated = 0;
  for (const demo of demoComponents) {
    const component = await prisma.component.findFirst({ where: demo });
    if (!component) continue;

    // Komponenten-Fremdschlüssel sind alle ON DELETE SET NULL, ein delete()
    // würde also NIE eine Exception werfen, selbst wenn die Komponente noch
    // in einem Vorgang ausgewählt ist. Verwendung deshalb explizit prüfen.
    const [pvUsage, hpUsage, climaUsage, costItemUsage] = await Promise.all([
      prisma.pvData.count({
        where: {
          OR: [
            { moduleComponentId: component.id },
            { inverterComponentId: component.id },
            { storageComponentId: component.id },
            { wallboxComponentId: component.id },
            { emsComponentId: component.id },
            { mountingSystemComponentId: component.id },
          ],
        },
      }),
      prisma.heatPumpData.count({
        where: {
          OR: [
            { heatPumpComponentId: component.id },
            { bufferComponentId: component.id },
          ],
        },
      }),
      prisma.climaData.count({ where: { climaComponentId: component.id } }),
      prisma.costItem.count({ where: { componentId: component.id } }),
    ]);

    if (pvUsage + hpUsage + climaUsage + costItemUsage > 0) {
      await prisma.component.update({
        where: { id: component.id },
        data: { active: false },
      });
      deactivated++;
    } else {
      await prisma.component.delete({ where: { id: component.id } });
      removed++;
    }
  }
  if (removed > 0 || deactivated > 0) {
    console.log(
      `Demo-Komponenten aufgeräumt: ${removed} gelöscht, ${deactivated} deaktiviert (noch in Verwendung).`
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
