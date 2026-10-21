
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const permissionDefinitions = [
  { key: "organizations.read", description: "View organization details" },
  { key: "organizations.update", description: "Update organization details" },

  { key: "departments.create", description: "Create departments" },
  { key: "departments.read", description: "View departments" },
  { key: "departments.update", description: "Update departments" },
  { key: "departments.delete", description: "Delete departments" },

  { key: "users.read", description: "View organization users" },
  { key: "users.invite", description: "Invite users" },
  { key: "users.update", description: "Update user access" },
  { key: "users.disable", description: "Disable user access" },

  { key: "roles.read", description: "View roles" },
  { key: "roles.manage", description: "Create and manage roles" },

  { key: "employees.create", description: "Create employee records" },
  { key: "employees.read", description: "View employee records" },
  { key: "employees.update", description: "Update employee records" },
  { key: "employees.delete", description: "Delete employee records" },

  { key: "finance.read", description: "View finance information" },
  { key: "inventory.read", description: "View inventory" },
  { key: "inventory.manage", description: "Manage inventory" },

  { key: "reports.read", description: "View reports" },
  { key: "audit_logs.read", description: "View audit logs" },
];

const allPermissionKeys = permissionDefinitions.map((p) => p.key);

const roleDefinitions = [
  {
    key: "organization_owner",
    name: "Organization Owner",
    description: "Full control of the organization",
    permissions: allPermissionKeys,
  },
  {
    key: "organization_admin",
    name: "Organization Admin",
    description: "Manage organization operations and access",
    permissions: allPermissionKeys.filter(
      (key) => key !== "organizations.update",
    ),
  },
  {
    key: "hr_manager",
    name: "HR Manager",
    description: "Manage employees and departments",
    permissions: [
      "departments.create",
      "departments.read",
      "departments.update",
      "users.read",
      "users.invite",
      "employees.create",
      "employees.read",
      "employees.update",
      "employees.delete",
      "reports.read",
    ],
  },
  {
    key: "hr_executive",
    name: "HR Executive",
    description: "Handle day-to-day employee records",
    permissions: [
      "departments.read",
      "employees.create",
      "employees.read",
      "employees.update",
    ],
  },
  {
    key: "finance_manager",
    name: "Finance Manager",
    description: "Access finance information and reports",
    permissions: ["finance.read", "reports.read"],
  },
  {
    key: "accountant",
    name: "Accountant",
    description: "Access finance information",
    permissions: ["finance.read"],
  },
  {
    key: "inventory_manager",
    name: "Inventory Manager",
    description: "Manage inventory operations",
    permissions: ["inventory.read", "inventory.manage"],
  },
  {
    key: "employee",
    name: "Employee",
    description: "Basic employee access",
    permissions: ["employees.read"],
  },
  {
    key: "auditor",
    name: "Auditor / Report Viewer",
    description: "Read reports and audit records",
    permissions: ["reports.read", "audit_logs.read"],
  },
];

async function main() {
  // 1. Create the global permission catalog.
  const permissionByKey = new Map<string, string>();

  for (const definition of permissionDefinitions) {
    const permission = await (prisma as any).permission.upsert({
      where: { key: definition.key },
      update: { description: definition.description },
      create: definition,
    });

    permissionByKey.set(permission.key, permission.id);
  }

  // 2. Create organization-specific roles.
  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
  });

  for (const organization of organizations) {
    for (const definition of roleDefinitions) {
      const role = await (prisma as any).role.upsert({
        where: {
          organizationId_key: {
            organizationId: organization.id,
            key: definition.key,
          },
        },
        update: {
          name: definition.name,
          description: definition.description,
          isSystem: true,
        },
        create: {
          organizationId: organization.id,
          key: definition.key,
          name: definition.name,
          description: definition.description,
          isSystem: true,
        },
      });

      // 3. Link each role to its configured permissions.
      for (const permissionKey of definition.permissions) {
        const permissionId = permissionByKey.get(permissionKey);

        if (!permissionId) {
          throw new Error(`Unknown permission: ${permissionKey}`);
        }

        await (prisma as any).rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
      }
    }

    console.log(`Seeded roles for organization: ${organization.name}`);
  }

  console.log(`Seeded ${permissionDefinitions.length} permissions.`);
  console.log(`Processed ${organizations.length} organizations.`);
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });