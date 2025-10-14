import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;
}