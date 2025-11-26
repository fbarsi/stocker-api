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
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['Manager', 'Employee'])
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  create(
    @Body() createItemDto: CreateItemDto,
    @Request() req: { user: { companyId: number } },
  ) {
    return this.itemsService.create(createItemDto, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: { user: { companyId: number } }) {
    return this.itemsService.findAllForCompany(req.user.companyId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { companyId: number } },
  ) {
    return this.itemsService.findOneForCompany(id, req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
    @Request() req: { user: { companyId: number } },
  ) {
    return this.itemsService.update(id, updateItemDto, req.user.companyId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { companyId: number } },
  ) {
    return this.itemsService.remove(id, req.user.companyId);
  }
}
