import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryMovement, MovementType } from '../inventory/entities/inventory_movement.entity';
import { MonthlyInventorySummary } from './entities/monthly_inventory_summary.entity';

@Injectable()
export class ReportsService {
  // Creamos un Logger para ver los mensajes del job en la consola
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    @InjectRepository(MonthlyInventorySummary)
    private readonly summaryRepository: Repository<MonthlyInventorySummary>,
    private readonly dataSource: DataSource, // DataSource para manejar transacciones
  ) {}

  /**
   * Este Cron Job se ejecuta el día 1 de cada mes a la 1:00 AM.
   */
  @Cron('*/1 * * * *') // Formato Cron: Minuto Hora Día Mes DíaDeLaSemana
  async handleMonthlyArchiving() {
    this.logger.log('Iniciando el proceso de archivado mensual de movimientos...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Determinar el mes y año a procesar (el mes anterior)
      const dateToProcess = new Date();
      const year = dateToProcess.getFullYear();
      const month = dateToProcess.getMonth();
      this.logger.log(`coso: ${month}`)

      this.logger.log(`Procesando datos para: ${month}-${year}`);

      // 2. Agregar los movimientos del mes pasado
      const movementsToSummarize = await this.movementRepository.createQueryBuilder('movement')
        .select('movement.item_id', 'item_id')
        .addSelect('movement.branch_id', 'branch_id')
        .addSelect(`'${year}'`, 'summary_year')
        .addSelect(`'${month}'`, 'summary_month')
        .addSelect("SUM(CASE WHEN movement.movement_type = 'INBOUND' THEN movement.bundle_change ELSE 0 END)", 'total_inbound_bundles')
        .addSelect("SUM(CASE WHEN movement.movement_type = 'INBOUND' THEN movement.unit_change ELSE 0 END)", 'total_inbound_units')
        .addSelect("SUM(CASE WHEN movement.movement_type = 'SALE' THEN movement.bundle_change ELSE 0 END) * -1", 'total_sale_bundles') // Invertimos el signo para que sea positivo
        .addSelect("SUM(CASE WHEN movement.movement_type = 'SALE' THEN movement.unit_change ELSE 0 END) * -1", 'total_sale_units')
        .addSelect("SUM(CASE WHEN movement.movement_type = 'ADJUSTMENT' THEN movement.bundle_change ELSE 0 END)", 'total_adjustment_bundles')
        .addSelect("SUM(CASE WHEN movement.movement_type = 'ADJUSTMENT' THEN movement.unit_change ELSE 0 END)", 'total_adjustment_units')
        .where('EXTRACT(YEAR FROM movement.timestamp) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM movement.timestamp) = :month', { month })
        .groupBy('movement.item_id, movement.branch_id')
        .getRawMany();

      if (movementsToSummarize.length > 0) {
        // Usamos el queryRunner para insertar el resumen dentro de la transacción
        await queryRunner.manager.getRepository(MonthlyInventorySummary).save(movementsToSummarize);
        this.logger.log(`Resumen de ${movementsToSummarize.length} registros creado exitosamente.`);
      } else {
        this.logger.log('No hay movimientos para resumir este mes.');
      }

      // 3. Borrar los movimientos antiguos (de hace más de un año)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const deleteResult = await queryRunner.manager.getRepository(InventoryMovement).delete({
        timestamp: LessThan(oneYearAgo),
      });

      if (deleteResult.affected) {
        this.logger.log(`Se borraron ${deleteResult.affected} movimientos antiguos.`);
      }

      // Si todo salió bien, confirmamos la transacción
      await queryRunner.commitTransaction();
      this.logger.log('Proceso de archivado mensual completado exitosamente.');

    } catch (error) {
      // Si algo falla, revertimos todos los cambios
      await queryRunner.rollbackTransaction();
      this.logger.error('Error durante el archivado mensual. La transacción fue revertida.', error.stack);
    } finally {
      // Liberamos el queryRunner
      await queryRunner.release();
    }
  }
}