import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('monthly_inventory_summary')
@Unique(['item', 'branch', 'summaryYear', 'summaryMonth'])
export class MonthlyInventorySummary {
  @PrimaryGeneratedColumn()
  summaryId: number;

  @Column({ name: 'summary_year', type: 'int' })
  summaryYear: number;

  @Column({ name: 'summary_month', type: 'int' })
  summaryMonth: number;

  @Column({ name: 'total_inbound_bundles', type: 'int', default: 0 })
  totalInboundBundles: number;

  @Column({ name: 'total_inbound_units', type: 'int', default: 0 })
  totalInboundUnits: number;

  @Column({ name: 'total_sale_bundles', type: 'int', default: 0 })
  totalSaleBundles: number;

  @Column({ name: 'total_sale_units', type: 'int', default: 0 })
  totalSaleUnits: number;

  @Column({ name: 'total_adjustment_bundles', type: 'int', default: 0 })
  totalAdjustmentBundles: number;

  @Column({ name: 'total_adjustment_units', type: 'int', default: 0 })
  totalAdjustmentUnits: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
