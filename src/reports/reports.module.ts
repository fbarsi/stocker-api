import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { InventoryMovement } from 'src/inventory/entities/inventory_movement.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyInventorySummary } from './entities/monthly_inventory_summary.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovement, MonthlyInventorySummary]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
