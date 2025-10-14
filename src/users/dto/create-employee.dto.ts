// src/users/dto/create-employee.dto.ts
import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsNumber()
  @IsNotEmpty()
  branchId: number; // El ID de la sucursal a la que pertenecerá
}