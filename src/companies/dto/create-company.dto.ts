// src/companies/dto/create-company.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  company_name: string;
}