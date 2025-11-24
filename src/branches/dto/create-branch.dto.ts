import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  branchName: string;

  @IsString()
  @IsOptional()
  address?: string;
}
