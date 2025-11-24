import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateInvitationDto {
  @IsEmail()
  @IsNotEmpty()
  employeeEmail: string;

  @IsNumber()
  @IsNotEmpty()
  branchId: number;
}
