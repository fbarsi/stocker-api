import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  SetMetadata,
  Patch, // 👈 Importa Patch
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto'; // 👈 Importa los nuevos DTOs
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Endpoints de Gestión de Perfil ---

  @Get('me')
  @UseGuards(JwtAuthGuard) // 🛡️ Solo para usuarios logueados
  getProfile(@Request() req) {
    // El servicio se encargará de buscar y devolver los datos del perfil
    return this.usersService.getProfile(req.user.user_id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.user_id, updateProfileDto);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.user_id, changePasswordDto);
  }

  // --- Endpoints de Administración (para Managers) ---

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['Manager'])
  findAll(@Request() req) {
    return this.usersService.findAllInCompany(req.user.companyId);
  }
}