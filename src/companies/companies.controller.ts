import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from 'src/interfaces';

@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Request() req: { user: AuthenticatedUser },
  ) {
    return this.companiesService.createAndAssignManager(
      createCompanyDto,
      req.user,
    );
  }
}
