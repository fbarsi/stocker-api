import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  branch_name: string;

  @IsString()
  @IsOptional() 
  address?: string;
}