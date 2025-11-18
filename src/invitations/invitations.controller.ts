import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  SetMetadata,
  Get,
  Param,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import type { RequestWithUser } from 'src/interfaces';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Manager'])
  sendInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.invitationsService.create(createInvitationDto, req.user);
  }

  @Get('/me')
  getMyInvitations(@Request() req: RequestWithUser) {
    return this.invitationsService.findForUser(req.user.email);
  }

  @Post('/:id/accept')
  acceptInvitation(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.invitationsService.accept(+id, req.user);
  }

  @Post('/:id/decline')
  declineInvitation(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.invitationsService.decline(+id, req.user);
  }
}
