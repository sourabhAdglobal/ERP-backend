
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const connectionString = process.env.DATABASE_URL;
const email = process.env.INITIAL_OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.INITIAL_OWNER_PASSWORD;
const organizationSlug = process.env.INITIAL_ORGANIZATION_SLUG;

if (!connectionString || !email || !password || !organizationSlug) {
  throw new Error(
    "Set DATABASE_URL, INITIAL_OWNER_EMAIL, INITIAL_OWNER_PASSWORD, and INITIAL_ORGANIZATION_SLUG in .env",
  );
}

if (password.length < 12) {
  throw new Error("Initial owner password must be at least 12 characters");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const organization = await prisma.organization.findUnique({
    where: { slug: organizationSlug },
  });

  if (!organization || !organization.isActive) {
    throw new Error(
      "Active organization not found. Check INITIAL_ORGANIZATION_SLUG.",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error(
      "This email already exists. Bootstrap stopped without changing the user's password.",
    );
  }

  const ownerRole = await prisma.role.findUnique({
    where: {
      organizationId_key: {
        organizationId: organization.id,
        key: "organization_owner",
      },
    },
  });

  if (!ownerRole) {
    throw new Error(
      "Owner role not found. Run npx prisma db seed successfully first.",
    );
  }

  const passwordHash = await argon2.hash(password!, {
    type: argon2.argon2id,
  });

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: email!,
        passwordHash,
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    const membership = await tx.organizationMembership.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        status: "ACTIVE",
      },
    });

    await tx.membershipRole.create({
      data: {
        membershipId: membership.id,
        roleId: ownerRole.id,
        organizationId: organization.id,
      },
    });

    console.log("Initial organization owner created successfully.");
    console.log(`Email: ${user.email}`);
    console.log(`Organization: ${organization.name}`);
    console.log("Password: configured from .env; not printed.");
  });
}

main()
  .catch((error) => {
    console.error("Bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });