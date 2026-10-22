
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const modules = [
  {
    key: "finance",
    name: "Finance & Accounting",
    price: "5000.00",
  },
  {
    key: "inventory",
    name: "Inventory Management",
    price: "3500.00",
  },
  {
    key: "procurement",
    name: "Procurement",
    price: "3000.00",
  },
  {
    key: "sales",
    name: "Sales Management",
    price: "3500.00",
  },
  {
    key: "crm",
    name: "Customer Relationship Management",
    price: "3000.00",
  },
  {
    key: "hr",
    name: "Human Resources",
    price: "3500.00",
  },
  {
    key: "manufacturing",
    name: "Manufacturing",
    price: "6000.00",
  },
  {
    key: "supply_chain",
    name: "Supply Chain Management",
    price: "4500.00",
  },
  {
    key: "warehouse",
    name: "Warehouse Management",
    price: "3500.00",
  },
  {
    key: "project_management",
    name: "Project Management",
    price: "2500.00",
  },
  {
    key: "asset_management",
    name: "Asset Management",
    price: "2500.00",
  },
  {
    key: "quality_management",
    name: "Quality Management",
    price: "3000.00",
  },
];

async function main() {
  for (const module of modules) {
    await prisma.erpModule.upsert({
      where: { key: module.key },

      // Existing records: update descriptive fields only.
      update: {
        name: module.name,
      },

      // New records: insert with initial pricing.
      create: {
        key: module.key,
        name: module.name,
        baseMonthlyPrice: module.price,
        perUserMonthlyPrice: "0.00",
      },
    });
  }

  console.log(`Successfully seeded ${modules.length} ERP modules.`);
}

main()
  .catch((error) => {
    console.error("ERP module seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });