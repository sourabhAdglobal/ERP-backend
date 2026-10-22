import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const organizationId = request.params?.organizationId;
    if (!userId || !organizationId) {
      throw new ForbiddenException(
        "User or organization context is missing",
      );
    }

    const membership =
      await this.prisma.organizationMembership.findFirst({
        where: {
          userId,
          organizationId,
          status: "ACTIVE",
          organization: {
            isActive: true,
          },
        },
        select: { id: true },
      });
    if (!membership) {
      throw new ForbiddenException(
        "You do not have access to this organization",
      );
    }

    return true;
  }
}