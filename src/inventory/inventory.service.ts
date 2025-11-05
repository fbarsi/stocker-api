import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import {
  InventoryMovement,
  MovementType,
} from './entities/inventory_movement.entity';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Branch } from '../branches/entities/branch.entity';
import { Item } from '../items/entities/item.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class InventoryService {
  constructor(private dataSource: DataSource) {}

  async getInventoryForBranch(branchId: number, user: any) {
    const userBranchId = user.role === 'Employee' ? user.branchId : null;

    if (userBranchId && userBranchId !== branchId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta sucursal.',
      );
    }

    return this.dataSource.getRepository(Inventory).find({
      where: {
        branch: {
          branch_id: branchId,
          company: { company_id: user.companyId },
        },
      },
      relations: ['item'],
      order: { item: { item_name: 'ASC' } },
    });
  }

  async adjustInventory(
    branchId: number,
    dto: AdjustInventoryDto,
    user: any,
    movementType: MovementType,
  ) {
    const { itemId } = dto;
    const bundleChange = dto.bundleChange ?? 0;
    const unitChange = dto.unitChange ?? 0;

    return this.dataSource.transaction(async (manager) => {
      const branch = await manager.findOneBy(Branch, {
        branch_id: branchId,
        company: { company_id: user.companyId },
      });
      if (!branch)
        throw new NotFoundException(
          'Sucursal no encontrada o no pertenece a tu empresa.',
        );

      if (user.role === 'Employee' && user.branchId !== branchId) {
        throw new ForbiddenException(
          'Solo puedes modificar el inventario de tu sucursal asignada.',
        );
      }

      const item = await manager.findOneBy(Item, {
        item_id: itemId,
        company: { company_id: user.companyId },
      });
      if (!item)
        throw new NotFoundException(
          'Artículo no encontrado o no pertenece a tu empresa.',
        );

      let inventory = await manager.findOne(Inventory, {
        where: { item: { item_id: itemId }, branch: { branch_id: branchId } },
      });

      if (!inventory) {
        if (movementType === MovementType.SALE)
          throw new BadRequestException(
            'No se puede vender un artículo sin stock inicial.',
          );
        inventory = manager.create(Inventory, {
          item,
          branch,
          bundle_quantity: 0,
          unit_quantity: 0,
        });
      }

      let totalUnits =
        inventory.bundle_quantity * item.units_per_bundle +
        inventory.unit_quantity;

      const sign = movementType === MovementType.SALE ? -1 : 1;
      const changeInUnits =
        (bundleChange * item.units_per_bundle + unitChange) * sign;

      if (
        movementType !== MovementType.INBOUND &&
        totalUnits + changeInUnits < 0
      ) {
        throw new BadRequestException(
          'Stock insuficiente para realizar esta operación.',
        );
      }

      totalUnits += changeInUnits;

      inventory.bundle_quantity = Math.floor(
        totalUnits / item.units_per_bundle,
      );
      inventory.unit_quantity = totalUnits % item.units_per_bundle;

      await manager.save(inventory);

      const movement = manager.create(InventoryMovement, {
        item,
        branch,
        user: { user_id: user.user_id },
        movement_type: movementType,
        bundle_change: bundleChange * sign,
        unit_change: unitChange * sign,
      });
      await manager.save(movement);

      return inventory;
    });
  }

  async getMovementsForItemInBranch(
    branchId: number,
    itemId: number,
    paginationQuery: PaginationQueryDto,
    user: any,
  ) {
    const { page = 1, limit = 20 } = paginationQuery;

    if (user.role === 'Employee' && user.branchId !== branchId) {
      throw new ForbiddenException(
        'No tienes permiso para ver los movimientos de esta sucursal.',
      );
    }

    const branchExists = await this.dataSource.getRepository(Branch).findOneBy({
      branch_id: branchId,
      company: { company_id: user.companyId },
    });
    if (!branchExists) {
      throw new NotFoundException(
        'Sucursal no encontrada o no pertenece a tu empresa.',
      );
    }

    const movementsRepository =
      this.dataSource.getRepository(InventoryMovement);
    const [movements, total] = await movementsRepository.findAndCount({
      where: {
        branch: { branch_id: branchId },
        item: { item_id: itemId },
      },
      relations: {
        user: true,
      },
      select: {
        movement_id: true,
        movement_type: true,
        bundle_change: true,
        unit_change: true,
        timestamp: true,
        user: {
          user_id: true,
          name: true,
          lastname: true,
        },
      },
      order: {
        timestamp: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: movements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
