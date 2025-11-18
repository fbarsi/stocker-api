import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { InventoryMovement } from '../inventory/entities/inventory_movement.entity';
import { MonthlyInventorySummary } from './entities/monthly_inventory_summary.entity';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(MonthlyInventorySummary)
    private readonly summaryRepository: Repository<MonthlyInventorySummary>,
    private readonly dataSource: DataSource,
  ) {}

  @Cron('0 1 1 * *')
  async handleMonthlyArchiving() {
    this.logger.log(
      'Iniciando el proceso de archivado mensual de movimientos...',
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const dateToProcess = new Date();
      const year = dateToProcess.getFullYear();
      const month = dateToProcess.getMonth();

      this.logger.log(`Procesando datos para: ${month}-${year}`);

      const movementsToSummarize = await this.movementRepository
        .createQueryBuilder('movement')
        .select('movement.item_id', 'item_id')
        .addSelect('movement.branch_id', 'branch_id')
        .addSelect(`'${year}'`, 'summary_year')
        .addSelect(`'${month}'`, 'summary_month')
        .addSelect(
          "SUM(CASE WHEN movement.movement_type = 'INBOUND' THEN movement.bundle_change ELSE 0 END)",
          'total_inbound_bundles',
        )
        .addSelect(
          "SUM(CASE WHEN movement.movement_type = 'INBOUND' THEN movement.unit_change ELSE 0 END)",
          'total_inbound_units',
        )
        .addSelect(
          "SUM(CASE WHEN movement.movement_type = 'SALE' THEN movement.bundle_change ELSE 0 END) * -1",
          'total_sale_bundles',
        ) 
        .addSelect(
          "SUM(CASE WHEN movement.movement_type = 'SALE' THEN movement.unit_change ELSE 0 END) * -1",
          'total_sale_units',
        )
        .addSelect(
          "SUM(CASE WHEN movement.movement_type = 'ADJUSTMENT' THEN movement.bundle_change ELSE 0 END)",
          'total_adjustment_bundles',
        )
        .addSelect(
          "SUM(CASE WHEN movement.movement_type = 'ADJUSTMENT' THEN movement.unit_change ELSE 0 END)",
          'total_adjustment_units',
        )
        .where('EXTRACT(YEAR FROM movement.timestamp) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM movement.timestamp) = :month', { month })
        .groupBy('movement.item_id, movement.branch_id')
        .getRawMany();

      if (movementsToSummarize.length > 0) {
        await queryRunner.manager
          .getRepository(MonthlyInventorySummary)
          .save(movementsToSummarize);
        this.logger.log(
          `Resumen de ${movementsToSummarize.length} registros creado exitosamente.`,
        );
      } else {
        this.logger.log('No hay movimientos para resumir este mes.');
      }

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const deleteResult = await queryRunner.manager
        .getRepository(InventoryMovement)
        .delete({
          timestamp: LessThan(oneYearAgo),
        });

      if (deleteResult.affected) {
        this.logger.log(
          `Se borraron ${deleteResult.affected} movimientos antiguos.`,
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log('Proceso de archivado mensual completado exitosamente.');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Error durante el archivado mensual. La transacción fue revertida.',
        error instanceof Error ? error.stack : error,
      );
    } finally {
      await queryRunner.release();
    }
  }
}
