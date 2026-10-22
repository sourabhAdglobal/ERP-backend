import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { InvitationsController } from "./invitations.controller";

@Module({
  imports: [PrismaModule],
  controllers: [UsersController,InvitationsController],
  providers: [UsersService],
})
export class UsersModule {}