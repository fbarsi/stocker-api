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
import type { AuthenticatedUser } from 'src/interfaces';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class InventoryService {
  constructor(private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async getInventoryForBranch(
    branchId: number,
    user: AuthenticatedUser,
  ): Promise<Inventory[]> {
    const userBranchId = user.role === 'Employee' ? user.branchId : null;

    if (userBranchId && userBranchId !== branchId) {
      throw new ForbiddenException(
        'No tienes permiso para acceder a esta sucursal.',
      );
    }

    return this.dataSource.getRepository(Inventory).find({
      where: {
        branch: {
          branchId: branchId,
          company: { companyId: user.companyId },
        },
      },
      relations: ['item'],
      order: { item: { itemName: 'ASC' } },
    });
  }

  async adjustInventory(
    branchId: number,
    dto: AdjustInventoryDto,
    user: AuthenticatedUser,
    movementType: MovementType,
  ) {
    const { itemId } = dto;
    const bundleChange = dto.bundleChange ?? 0;
    const unitChange = dto.unitChange ?? 0;

    return this.dataSource.transaction(async (manager) => {
      const branch = await manager.findOneBy(Branch, {
        branchId: branchId,
        company: { companyId: user.companyId },
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
        itemId: itemId,
        company: { companyId: user.companyId },
      });
      if (!item)
        throw new NotFoundException(
          'Artículo no encontrado o no pertenece a tu empresa.',
        );

      let inventory = await manager.findOne(Inventory, {
        where: { item: { itemId: itemId }, branch: { branchId: branchId } },
      });

      if (!inventory) {
        if (movementType === MovementType.SALE)
          throw new BadRequestException(
            'No se puede vender un artículo sin stock inicial.',
          );
        inventory = manager.create(Inventory, {
          item,
          branch,
          bundleQuantity: 0,
          unitQuantity: 0,
        });
      }

      let totalUnits =
        inventory.bundleQuantity * item.unitsPerBundle +
        inventory.unitQuantity;

      const sign = movementType === MovementType.SALE ? -1 : 1;
      const changeInUnits =
        (bundleChange * item.unitsPerBundle + unitChange) * sign;

      if (
        movementType !== MovementType.INBOUND &&
        totalUnits + changeInUnits < 0
      ) {
        throw new BadRequestException(
          'Stock insuficiente para realizar esta operación.',
        );
      }

      totalUnits += changeInUnits;

      inventory.bundleQuantity = Math.floor(
        totalUnits / item.unitsPerBundle,
      );
      inventory.unitQuantity = totalUnits % item.unitsPerBundle;

      await manager.save(inventory);

      const movement = manager.create(InventoryMovement, {
        item,
        branch,
        user: { userId: user.userId },
        movementType: movementType,
        bundleChange: bundleChange * sign,
        unitChange: unitChange * sign,
      });
      await manager.save(movement);

      const currentTotalUnits = inventory.bundleQuantity * item.unitsPerBundle + inventory.unitQuantity;
      const UMBRAL = 10; 

      if ((movementType === MovementType.SALE || movementType === MovementType.ADJUSTMENT) && currentTotalUnits <= UMBRAL) {
        const managers = await manager.find(User, {
            where: { 
                company: { companyId: user.companyId },
                role: { role_name: 'Manager' } 
            },
            select: ['pushToken']
        });
        
        const tokens = managers.map(u => u.pushToken).filter(t => t);

        if (tokens.length > 0) {
             this.notificationsService.sendPushNotification(
                tokens,
                "Stock Bajo",
                `Quedan solo ${currentTotalUnits} unidades de "${item.itemName}" en "${branch.branchName}".`,
                { itemId: item.itemId, branchId: branch.branchId }
             );
        }
      }

      return inventory;
    });
  }

  async getMovementsForItemInBranch(
    branchId: number,
    itemId: number,
    paginationQuery: PaginationQueryDto,
    user: AuthenticatedUser,
  ) {
    const { page = 1, limit = 20 } = paginationQuery;

    if (user.role === 'Employee' && user.branchId !== branchId) {
      throw new ForbiddenException(
        'No tienes permiso para ver los movimientos de esta sucursal.',
      );
    }

    const branchExists = await this.dataSource.getRepository(Branch).findOneBy({
      branchId: branchId,
      company: { companyId: user.companyId },
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
        branch: { branchId: branchId },
        item: { itemId: itemId },
      },
      relations: {
        user: true,
      },
      select: {
        movementId: true,
        movementType: true,
        bundleChange: true,
        unitChange: true,
        timestamp: true,
        user: {
          userId: true,
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

  async getMovementsForBranch(
    branchId: number,
    paginationQuery: PaginationQueryDto,
    user: AuthenticatedUser
  ) {
    const { page = 1, limit = 20 } = paginationQuery;

    if (user.role === 'Employee' && user.branchId !== branchId) {
      throw new ForbiddenException('No tienes permiso para ver esta sucursal.');
    }

    return this.dataSource.getRepository(InventoryMovement).find({
      where: { branch: { branchId } },
      relations: ['item', 'user'],
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
}
