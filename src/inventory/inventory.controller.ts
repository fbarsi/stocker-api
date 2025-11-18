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
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MovementType } from './entities/inventory_movement.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import type { RequestWithUser } from 'src/interfaces';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['Manager', 'Employee'])
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('branch/:branchId')
  getBranchInventory(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Request() req: RequestWithUser,
  ) {
    return this.inventoryService.getInventoryForBranch(branchId, req.user);
  }

  @Post('branch/:branchId/inbound')
  inbound(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.inventoryService.adjustInventory(
      branchId,
      adjustDto,
      req.user,
      MovementType.INBOUND,
    );
  }

  @Post('branch/:branchId/sale')
  sale(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.inventoryService.adjustInventory(
      branchId,
      adjustDto,
      req.user,
      MovementType.SALE,
    );
  }

  @Post('branch/:branchId/adjustment')
  adjustment(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.inventoryService.adjustInventory(
      branchId,
      adjustDto,
      req.user,
      MovementType.ADJUSTMENT,
    );
  }

  @Get('movements/branch/:branchId/item/:itemId')
  getItemMovements(
    @Param('branchId', ParseIntPipe) branchId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Query() paginationQuery: PaginationQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.inventoryService.getMovementsForItemInBranch(
      branchId,
      itemId,
      paginationQuery,
      req.user,
    );
  }
}
