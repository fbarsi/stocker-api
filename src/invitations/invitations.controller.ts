// src/invitations/invitations.controller.ts
import { Controller, Post, Body, UseGuards, Request, SetMetadata, Get, Param } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['Manager'])
  sendInvitation(@Body() createInvitationDto: CreateInvitationDto, @Request() req) {
    return this.invitationsService.create(createInvitationDto, req.user);
  }

  @Get('/me')
  getMyInvitations(@Request() req) {
    return this.invitationsService.findForUser(req.user.email);
  }

  @Post('/:id/accept')
  acceptInvitation(@Param('id') id: string, @Request() req) {
    return this.invitationsService.accept(+id, req.user);
  }

  @Post('/:id/decline')
  declineInvitation(@Param('id') id: string, @Request() req) {
    return this.invitationsService.decline(+id, req.user);
  }
}