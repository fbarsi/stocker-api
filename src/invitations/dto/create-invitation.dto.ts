// src/invitations/dto/create-invitation.dto.ts
import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  employee_email: string;

  @IsNumber()
  @IsNotEmpty()
  branchId: number;
}