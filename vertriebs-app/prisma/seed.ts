import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = "admin@firma.de";
  const adminPassword = "willkommen123";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  console.log(`Benutzer bereit: ${adminEmail} / ${adminPassword}`);

  const components: Array<{
    category: string;
    manufacturer: string;
    name: string;
    price: number;
    specs: Record<string, number>;
  }> = [
    {
      category: "MODUL",
      manufacturer: "Jinko Solar",
      name: "Tiger Neo 440",
      price: 129,
      specs: { wattPeak: 440, efficiencyPercent: 22.3 },
    },
    {
      category: "MODUL",
      manufacturer: "Meyer Burger",
      name: "White 400",
      price: 179,
      specs: { wattPeak: 400, efficiencyPercent: 21.7 },
    },
    {
      category: "WECHSELRICHTER",
      manufacturer: "Huawei",
      name: "SUN2000-8KTL",
      price: 1450,
      specs: { powerKw: 8, mpptCount: 2 },
    },
    {
      category: "WECHSELRICHTER",
      manufacturer: "SMA",
      name: "Sunny Tripower 10.0",
      price: 1890,
      specs: { powerKw: 10, mpptCount: 2 },
    },
    {
      category: "SPEICHER",
      manufacturer: "BYD",
      name: "Battery-Box Premium HVS 10.2",
      price: 5200,
      specs: { capacityKwh: 10.2 },
    },
    {
      category: "WALLBOX",
      manufacturer: "KEBA",
      name: "KeContact P30",
      price: 890,
      specs: { chargingPowerKw: 22 },
    },
    {
      category: "ENERGIEMANAGER",
      manufacturer: "Fronius",
      name: "Smart Meter + Ohmpilot",
      price: 650,
      specs: {},
    },
    {
      category: "MONTAGESYSTEM",
      manufacturer: "K2 Systems",
      name: "Dome 6 Schrägdach",
      price: 90,
      specs: {},
    },
    {
      category: "WAERMEPUMPE",
      manufacturer: "Vaillant",
      name: "aroTHERM plus 7 kW",
      price: 9800,
      specs: { heatingPowerKw: 7, jaz: 4.1 },
    },
    {
      category: "WAERMEPUMPE",
      manufacturer: "Viessmann",
      name: "Vitocal 250-A 10 kW",
      price: 12500,
      specs: { heatingPowerKw: 10, jaz: 3.8 },
    },
    {
      category: "PUFFERSPEICHER",
      manufacturer: "Viessmann",
      name: "Vitocell 100-E 300L",
      price: 980,
      specs: { volumeLiters: 300 },
    },
  ];

  for (const component of components) {
    const existing = await prisma.component.findFirst({
      where: { manufacturer: component.manufacturer, name: component.name },
    });
    if (!existing) {
      await prisma.component.create({
        data: {
          category: component.category,
          manufacturer: component.manufacturer,
          name: component.name,
          price: component.price,
          specs: JSON.stringify(component.specs),
        },
      });
    }
  }
  console.log(`${components.length} Komponenten bereit.`);

  const existingCustomer = await prisma.customer.findFirst({
    where: { lastName: "Mustermann" },
  });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        salutation: "Herr",
        firstName: "Max",
        lastName: "Mustermann",
        street: "Musterstraße 1",
        postalCode: "12345",
        city: "Musterstadt",
        phone: "0170 1234567",
        email: "max.mustermann@example.com",
        buildingType: "EFH",
        buildYear: 1998,
        ownerId: admin.id,
      },
    });
    console.log("Beispielkunde angelegt: Max Mustermann");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
