
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
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

const testOrganizations = [
  { name: "Acme Corporation", slug: "acme-corporation" },
  { name: "Globex Corporation", slug: "globex-corporation" },
  { name: "Initech Corporation", slug: "initech-corporation" },
  { name: "Umbrella Corporation", slug: "umbrella-corporation" },
];

const departmentDefinitions = [
  { name: "Engineering", code: "ENG" },
  { name: "Human Resources", code: "HR" },
  { name: "Finance", code: "FIN" },
  { name: "Operations", code: "OPS" },
];

const testPassword = "Test1234!";

async function main() {

  // 1. Create organizations (reuse existing organizations by slug).
for (const definition of testOrganizations) {
  const organization = await prisma.organization.upsert({
    where: { slug: definition.slug },
    update: {},
    create: {
      name: definition.name,
      slug: definition.slug,
    },
  });

  console.log(`Organization ready: ${organization.name}`);
}

// Hash the shared development-only test password once.
const passwordHash = await argon2.hash(testPassword);

const newOrganizations = await prisma.organization.findMany({
  where: {
    slug: { in: testOrganizations.map((org) => org.slug) },
  },
  select: {
    id: true,
    name: true,
    slug: true,
  },
});

// 2. Create four departments and four users per organization.
for (const organization of newOrganizations) {
  const departments: { id: string; name: string }[] = [];

  for (const definition of departmentDefinitions) {
    const department = await prisma.department.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: definition.code,
        },
      },
      update: {
        name: definition.name,
        isActive: true,
      },
      create: {
        organizationId: organization.id,
        name: definition.name,
        code: definition.code,
        isActive: true,
      },
    });

    departments.push(department);
  }

  const prefix =
    organization.slug === "acme-corporation"
      ? "a"
      : organization.slug === "globex-corporation"
        ? "b"
        : organization.slug === "initech-corporation"
          ? "c"
          : "d";

  for (let i = 0; i < 4; i++) {
    const email = `${prefix}.user${i + 1}@test.com`;

    // Create or reuse the user. Email is globally unique.
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        status: "ACTIVE",
        passwordHash,
      },
      create: {
        email,
        passwordHash,
        status: "ACTIVE",
      },
    });

    // Give the user an active membership in this organization.
    const membership = await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: {
        status: "ACTIVE",
      },
      create: {
        organizationId: organization.id,
        userId: user.id,
        status: "ACTIVE",
      },
    });

    // Assign each user to one department.
    const department = departments[i];

    await prisma.membershipDepartment.upsert({
      where: {
        membershipId_departmentId: {
          membershipId: membership.id,
          departmentId: department.id,
        },
      },
      update: {},
      create: {
        membershipId: membership.id,
        departmentId: department.id,
        organizationId: organization.id,
      },
    });

    console.log(
      `User ready: ${email} -> ${organization.name} -> ${department.name}`,
    );
  }
}
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

  // 4. Assign organization_admin to the first user
// and employee to the remaining three users.
for (const organization of organizations) {
  const prefix =
    organization.name === "Acme Corporation"
      ? "a"
      : organization.name === "Globex Corporation"
        ? "b"
        : organization.name === "Initech Corporation"
          ? "c"
          : "d";

  for (let i = 0; i < 4; i++) {
    const email = `${prefix}.user${i + 1}@test.com`;

    const user = await prisma.user.findUniqueOrThrow({
      where: { email },
    });

    const membership = await prisma.organizationMembership.findUniqueOrThrow({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
    });

    const roleKey = i === 0 ? "organization_admin" : "employee";

    const role = await prisma.role.findUniqueOrThrow({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: roleKey,
        },
      },
    });

    await prisma.membershipRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: membership.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        membershipId: membership.id,
        roleId: role.id,
        organizationId: organization.id,
      },
    });
  }

  console.log(`Role assignments ready: ${organization.name}`);
}
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });