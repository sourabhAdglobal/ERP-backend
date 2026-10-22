
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PlatformSuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException("Authentication required");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        isPlatformSuperAdmin: true,
      },
    });

    if (
      !user ||
      user.status !== "ACTIVE" ||
      !user.isPlatformSuperAdmin
    ) {
      throw new ForbiddenException(
        "Platform Super Admin access required",
      );
    }

    return true;
  }
}