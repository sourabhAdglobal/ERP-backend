
import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { DepartmentsController } from "./departments.controller";
import { DepartmentsService } from "./departments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationAccessGuard } from "../auth/guards/organization-access.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
@Module({
  imports: [PrismaModule],
  controllers: [DepartmentsController],
  providers: [
    DepartmentsService,
    PermissionsGuard,
    JwtAuthGuard,
    OrganizationAccessGuard,
  ],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}