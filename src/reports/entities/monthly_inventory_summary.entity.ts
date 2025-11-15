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
@Unique(['item', 'branch', 'summary_year', 'summary_month'])
export class MonthlyInventorySummary {
  @PrimaryGeneratedColumn()
  summary_id: number;

  @Column({ type: 'int' })
  summary_year: number;

  @Column({ type: 'int' })
  summary_month: number;

  @Column({ type: 'int', default: 0 })
  total_inbound_bundles: number;

  @Column({ type: 'int', default: 0 })
  total_inbound_units: number;

  @Column({ type: 'int', default: 0 })
  total_sale_bundles: number;

  @Column({ type: 'int', default: 0 })
  total_sale_units: number;

  @Column({ type: 'int', default: 0 })
  total_adjustment_bundles: number;

  @Column({ type: 'int', default: 0 })
  total_adjustment_units: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
