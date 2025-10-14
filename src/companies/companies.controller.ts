// src/companies/companies.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('companies')
@UseGuards(JwtAuthGuard) // 🛡️ Protegemos la ruta
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req) {
    // req.user contiene el payload del token del usuario logueado
    return this.companiesService.createAndAssignManager(createCompanyDto, req.user);
  }
}