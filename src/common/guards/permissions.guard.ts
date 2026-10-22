
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { REQUIRED_PERMISSIONS } from "../decorators/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
        REQUIRED_PERMISSIONS,
        [context.getHandler(), context.getClass()],
      );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const organizationId = request.params?.organizationId;

    if (!userId || !organizationId) {
      throw new UnauthorizedException("Authentication required");
    }

    const membership =
      await this.prisma.organizationMembership.findFirst({
        where: {
          userId,
          organizationId,
          status: "ACTIVE",
          organization: { isActive: true },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!membership) {
      throw new ForbiddenException(
        "You do not belong to this organization",
      );
    }

    const grantedPermissions = new Set(
      membership.roles.flatMap((membershipRole) =>
        membershipRole.role.permissions.map(
          (rolePermission) => rolePermission.permission.key,
        ),
      ),
    );

    const hasAllPermissions = requiredPermissions.every(
      (permission) => grantedPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        "You do not have permission to perform this action",
      );
    }

    return true;
  }
}