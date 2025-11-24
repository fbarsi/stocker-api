import { Controller, Post, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { User } from 'src/users/entities/user.entity';
import type { AuthenticatedUser } from 'src/interfaces';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: Partial<User> }) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Request() req: { user: AuthenticatedUser }) {
    return this.authService.refreshToken(req.user);
  }
}
