import { Controller, Get, Post, Body, UseGuards, Request, SetMetadata } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @SetMetadata('roles', ['Manager'])
  findAll(@Request() req) {
    const manager = req.user;
    return this.usersService.findAllInCompany(manager.companyId);
  }
}