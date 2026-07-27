import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ist nicht gesetzt");
}
const adapter = new PrismaPg({ connectionString });
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

  const lastCheckedAt = new Date("2026-07-27");

  const fundingPrograms: Array<{
    name: string;
    provider: string;
    appliesTo: string;
    fundingType: string;
    description: string;
    percentageOfCost?: number;
    maxAmountEur?: number;
    requiresExistingBuilding?: boolean;
    requiresOwnerOccupied?: boolean;
    maxHouseholdIncomeEur?: number;
    conditions: string;
    sourceUrl: string;
  }> = [
    {
      name: "KfW 458 – Grundförderung Wärmepumpe",
      provider: "KFW",
      appliesTo: "WAERMEPUMPE",
      fundingType: "ZUSCHUSS",
      description:
        "Grundförderung für den Austausch der Heizung gegen eine Wärmepumpe in einem Bestandsgebäude.",
      percentageOfCost: 30,
      maxAmountEur: 8400,
      requiresExistingBuilding: true,
      conditions:
        "Baugenehmigung des Gebäudes mindestens 5 Jahre alt. Förderfähige Kosten gedeckelt auf 28.000 € für die erste Wohneinheit (Stand 21.07.2026). Antrag muss vor Beauftragung gestellt werden.",
      sourceUrl:
        "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/F%C3%B6rderprodukte/Heizungsf%C3%B6rderung-f%C3%BCr-Privatpersonen-Wohngeb%C3%A4ude-(458)/",
    },
    {
      name: "KfW 458 – Klima-Geschwindigkeits-Bonus",
      provider: "KFW",
      appliesTo: "WAERMEPUMPE",
      fundingType: "ZUSCHUSS",
      description:
        "Zusätzlicher Bonus für einen besonders frühzeitigen Austausch einer alten fossilen Heizung.",
      percentageOfCost: 16,
      maxAmountEur: 4480,
      requiresExistingBuilding: true,
      conditions:
        "Nur bei Austausch einer funktionstüchtigen fossilen Heizung (Öl/Gas/Kohle), die mindestens 20 Jahre alt ist, oder einer Öl-, Kohle-, Gasetagen- oder Nachtspeicherheizung jeden Alters. Bonussatz seit 21.07.2026 auf 16% gesenkt und sinkt in Folgejahren weiter. Kombinierbar mit Grundförderung.",
      sourceUrl: "https://www.kfw.de/inlandsfoerderung/Privatpersonen/",
    },
    {
      name: "KfW 458 – Einkommensbonus",
      provider: "KFW",
      appliesTo: "WAERMEPUMPE",
      fundingType: "ZUSCHUSS",
      description:
        "Zusätzlicher, gestaffelter Bonus für Haushalte mit niedrigerem Einkommen.",
      requiresExistingBuilding: true,
      requiresOwnerOccupied: true,
      maxHouseholdIncomeEur: 40000,
      conditions:
        "Nur für selbstnutzende Eigentümer mit zu versteuerndem Haushaltsjahreseinkommen bis 40.000 €. Bonushöhe gestaffelt nach Einkommen. Kombinierbar mit Grundförderung und Klima-Geschwindigkeits-Bonus; Gesamtförderung gedeckelt auf max. 70% (bei sehr niedrigem Einkommen bis 80%).",
      sourceUrl: "https://www.kfw.de/inlandsfoerderung/Privatpersonen/",
    },
    {
      name: "Steuerbonus energetische Sanierung (§35c EStG)",
      provider: "BUND",
      appliesTo: "WAERMEPUMPE",
      fundingType: "STEUERVORTEIL",
      description:
        "Steuerermäßigung über 3 Jahre als Alternative zum KfW-Zuschuss.",
      percentageOfCost: 20,
      maxAmountEur: 40000,
      requiresOwnerOccupied: true,
      conditions:
        "Nur für selbstgenutztes Wohneigentum, Gebäude älter als 10 Jahre. Anrechnung auf die Steuerschuld: 7% im Jahr der Fertigstellung, 7% im Folgejahr, 6% im übernächsten Jahr. Nicht kombinierbar mit KfW-458-Zuschuss für dieselbe Maßnahme – Alternative, keine Ergänzung.",
      sourceUrl: "https://www.gesetze-im-internet.de/estg/__35c.html",
    },
    {
      name: "0% Umsatzsteuer auf PV-Anlagen",
      provider: "BUND",
      appliesTo: "PV",
      fundingType: "STEUERVORTEIL",
      description:
        "Kauf und Installation von PV-Anlagen inkl. Speicher sind umsatzsteuerbefreit.",
      conditions:
        "Gilt für Anlagen bis 30 kWp auf/an Wohngebäuden, inkl. Batteriespeicher. Kein Antrag nötig, wird direkt in der Rechnung berücksichtigt. Zusätzlich sind Einnahmen aus solchen Anlagen einkommensteuerfrei.",
      sourceUrl: "https://www.gesetze-im-internet.de/ustg_1980/__12.html",
    },
    {
      name: "KfW 270 – Erneuerbare Energien Standard",
      provider: "KFW",
      appliesTo: "PV",
      fundingType: "KREDIT",
      description: "Zinsgünstiger Kredit zur Finanzierung von PV-Anlage und Speicher.",
      conditions:
        "Bis zu 100% der Investitionskosten finanzierbar, lange Laufzeiten, Zinssatz abhängig von Bonität (variiert deutlich). Auch für Nachrüstung eines Speichers nutzbar.",
      sourceUrl: "https://www.kfw.de/inlandsfoerderung/Privatpersonen/Bestehende-Immobilie/",
    },
    {
      name: "Landes-/Kommunalförderung PV-Speicher",
      provider: "LAND",
      appliesTo: "PV",
      fundingType: "ZUSCHUSS",
      description: "Regionale Zuschüsse für Batteriespeicher, je nach Bundesland/Kommune.",
      maxAmountEur: 3000,
      conditions:
        "Sehr unterschiedlich je nach Bundesland und Kommune (üblich: 500–3.000 €). Im Einzelfall prüfen, ob am Standort des Kunden aktuell ein Programm existiert.",
      sourceUrl: "https://www.energie-experten.org/erneuerbare-energien/photovoltaik",
    },
  ];

  for (const program of fundingPrograms) {
    const existing = await prisma.fundingProgram.findFirst({
      where: { name: program.name },
    });
    if (!existing) {
      await prisma.fundingProgram.create({
        data: { ...program, lastCheckedAt },
      });
    }
  }
  console.log(`${fundingPrograms.length} Förderprogramme bereit.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
