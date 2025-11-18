import { IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AdjustInventoryDto {
  @IsInt()
  @IsNotEmpty()
  itemId: number;

  @IsNumber()
  @IsOptional()
  bundleChange?: number = 0;

  @IsNumber()
  @IsOptional()
  unitChange?: number = 0;
}
