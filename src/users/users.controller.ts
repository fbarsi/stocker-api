import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  SetMetadata,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { RequestWithUser } from 'src/interfaces';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.user_id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.user_id, updateProfileDto);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.user_id,
      changePasswordDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['Manager'])
  findAll(@Request() req: RequestWithUser) {
    return this.usersService.findAllInCompany(req.user.companyId);
  }
}
