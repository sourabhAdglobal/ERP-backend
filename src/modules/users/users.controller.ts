import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OrganizationAccessGuard } from "../../common/guards/organization-access.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { UsersService } from "./users.service";

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller("organizations/:organizationId/invitations")
@UseGuards(
  JwtAuthGuard,
  OrganizationAccessGuard,
  PermissionsGuard,
)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions("users.invite")
  createInvitation(
    @Param("organizationId") organizationId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.usersService.createInvitation(
      organizationId,
      request.user.sub,
      dto,
    );
  }

}