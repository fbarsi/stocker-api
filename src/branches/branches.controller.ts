import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  SetMetadata,
  ParseIntPipe,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['Manager'])
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(@Body() createBranchDto: CreateBranchDto, @Request() req) {
    return this.branchesService.create(createBranchDto, req.user.companyId);
  }

  @Get()
  findAll(@Request() req) {
    return this.branchesService.findAllForCompany(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.branchesService.findOneForCompany(id, req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBranchDto: UpdateBranchDto,
    @Request() req,
  ) {
    return this.branchesService.update(id, updateBranchDto, req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.branchesService.remove(id, req.user.companyId);
  }
}