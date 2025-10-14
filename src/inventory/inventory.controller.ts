import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  SetMetadata,
  Param,
  ParseIntPipe,
  Get,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MovementType } from './inventory_movement.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['Manager', 'Employee']) // 👥 Ambos roles pueden acceder
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // --- Endpoints para consultar el stock ---
  @Get('branch/:branchId')
  getBranchInventory(@Param('branchId', ParseIntPipe) branchId: number, @Request() req) {
    return this.inventoryService.getInventoryForBranch(branchId, req.user);
  }

  // --- Endpoints para modificar el stock ---
  @Post('branch/:branchId/inbound')
  inbound(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req,
  ) {
    return this.inventoryService.adjustInventory(branchId, adjustDto, req.user, MovementType.INBOUND);
  }

  @Post('branch/:branchId/sale')
  sale(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req,
  ) {
    return this.inventoryService.adjustInventory(branchId, adjustDto, req.user, MovementType.SALE);
  }
  
  @Post('branch/:branchId/adjustment')
  adjustment(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req,
  ) {
    return this.inventoryService.adjustInventory(branchId, adjustDto, req.user, MovementType.ADJUSTMENT);
  }
}