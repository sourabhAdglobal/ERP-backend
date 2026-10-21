
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class OrganizationAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const userId = request.user?.userId;
    const organizationId = request.params?.organizationId;

    if (!userId || !organizationId) {
      return false;
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

    return Boolean(membership);
  }
}