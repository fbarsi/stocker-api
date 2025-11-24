import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  unitsPerBundle?: number = 1;
}
