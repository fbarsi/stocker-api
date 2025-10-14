import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // 👈 Importa esto
import { Inventory } from './inventory.entity'; // 👈 Importa tus entidades
import { InventoryMovement } from './inventory_movement.entity';
import { Item } from 'src/items/item.entity';
import { Branch } from 'src/branches/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventory, InventoryMovement, Item, Branch]), // 👈 Añade esta línea
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
