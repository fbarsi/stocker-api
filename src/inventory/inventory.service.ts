import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryMovement, MovementType } from './entities/inventory_movement.entity';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Branch } from '../branches/entities/branch.entity';
import { Item } from '../items/entities/item.entity';

@Injectable()
export class InventoryService {
  constructor(private dataSource: DataSource) {}

  async getInventoryForBranch(branchId: number, user: any) {
    const userBranchId = user.role === 'Employee' ? user.branchId : null;

    // Un empleado solo puede ver el inventario de su propia sucursal
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
      // 1. 🛡️ VERIFICACIÓN DE SEGURIDAD
      // Asegurarse de que la sucursal y el artículo pertenezcan a la empresa del usuario.
      const branch = await manager.findOneBy(Branch, {
        branch_id: branchId,
        company: { company_id: user.companyId },
      });
      if (!branch)
        throw new NotFoundException(
          'Sucursal no encontrada o no pertenece a tu empresa.',
        );

      // Un empleado solo puede modificar el stock de su propia sucursal
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

      // 2. OBTENER O CREAR EL REGISTRO DE INVENTARIO
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

      // 3. ⚖️ LÓGICA DE CÁLCULO DE STOCK (NORMALIZACIÓN)
      let totalUnits =
        inventory.bundle_quantity * item.units_per_bundle +
        inventory.unit_quantity;

      // Para ventas, los cambios son negativos. Para ingresos, positivos.
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

      // 4. ✍️ CREAR EL MOVIMIENTO EN EL HISTORIAL
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
}
