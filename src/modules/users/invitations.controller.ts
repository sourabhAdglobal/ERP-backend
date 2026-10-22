import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly usersService: UsersService) {}

  @Post('accept')
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.usersService.acceptInvitation(dto);
  }
}