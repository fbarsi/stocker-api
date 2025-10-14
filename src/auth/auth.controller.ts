// src/auth/auth.controller.ts
import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto'; // DTO para registrarse
import { LocalAuthGuard } from './guards/local-auth.guard'; // Guard para el login

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    // El DTO asegura que lleguen datos como { company_name, full_name, email, password, role_name }
    return this.authService.register(createUserDto);
  }

  // POST /auth/login
  @UseGuards(LocalAuthGuard) // Este Guard valida email y password antes de ejecutar el método
  @Post('login')
  async login(@Request() req) {
    // Si LocalAuthGuard pasa, significa que req.user ya tiene los datos del usuario validado
    return this.authService.login(req.user); // El servicio genera y devuelve el JWT
  }
}