import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import * as argon2 from "argon2";
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvitation(
    organizationId: string,
    invitedByUserId: string,
    dto: CreateInvitationDto,
  ) {
    const email = dto.email.trim().toLowerCase();
    const now = new Date();

    const organization = await this.prisma.organization.findFirst({
      where: {
        id: organizationId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        memberships: {
          where: {
            organizationId,
            status: "ACTIVE",
          },
          select: { id: true },
        },
      },
    });

    if (existingUser?.memberships.length) {
      throw new ConflictException(
        "This user is already an active member of the organization",
      );
    }

    const pendingInvitation =
      await this.prisma.invitation.findFirst({
        where: {
          organizationId,
          email,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        select: { id: true },
      });

    if (pendingInvitation) {
      throw new ConflictException(
        "A valid invitation already exists for this email",
      );
    }

    // Generate a high-entropy token; store only its SHA-256 hash.
    const invitationToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256")
      .update(invitationToken)
      .digest("hex");

    const expiresAt = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );

    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email,
        tokenHash,
        invitedByUserId,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Development-only: expose the token for manual testing.
    // Production must deliver it through a trusted email service.
    if (process.env.NODE_ENV === "production") {
      return {
        message: "Invitation created",
        invitation,
      };
    }

    return {
      message: "Invitation created",
      invitation,
      invitationToken,
    };
  }

  
async acceptInvitation(dto: AcceptInvitationDto) {
  const tokenHash = createHash("sha256")
    .update(dto.token)
    .digest("hex");

  const passwordHash = await argon2.hash(dto.password);
  const now = new Date();

  return this.prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findFirst({
      where: {
        tokenHash,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
        organization: {
          isActive: true,
        },
      },
    });

    if (!invitation) {
      throw new BadRequestException(
        "Invitation is invalid, expired, revoked, or already used",
      );
    }

    // Claim the invitation exactly once. Concurrent acceptance attempts
    // cannot both proceed successfully.
    const claimed = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        acceptedAt: now,
      },
    });

    if (claimed.count !== 1) {
      throw new BadRequestException(
        "Invitation is invalid, expired, revoked, or already used",
      );
    }

    let user = await tx.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          status: "ACTIVE",
          emailVerifiedAt: now,
        },
      });
    } else {
      // Preserve an existing account's password when the person
      // already has an account in another organization.
      if (!user.passwordHash) {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            status: "ACTIVE",
            emailVerifiedAt: now,
          },
        });
      } else if (user.status !== "ACTIVE") {
        throw new ConflictException(
          "This account is disabled. Contact an administrator.",
        );
      }
    }

    const membership = await tx.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: user.id,
        },
      },
      update: {
        status: "ACTIVE",
      },
      create: {
        organizationId: invitation.organizationId,
        userId: user.id,
        status: "ACTIVE",
      },
    });

    const employeeRole = await tx.role.findUnique({
      where: {
        organizationId_key: {
          organizationId: invitation.organizationId,
          key: "employee",
        },
      },
    });

    if (!employeeRole) {
      throw new Error(
        "Employee role is missing. Run the database seed first.",
      );
    }

    await tx.membershipRole.upsert({
      where: {
        membershipId_roleId: {
          membershipId: membership.id,
          roleId: employeeRole.id,
        },
      },
      update: {},
      create: {
        membershipId: membership.id,
        roleId: employeeRole.id,
        organizationId: invitation.organizationId,
      },
    });

    return {
      message: "Invitation accepted successfully",
      email: user.email,
      organizationId: invitation.organizationId,
    };
  });
}
}