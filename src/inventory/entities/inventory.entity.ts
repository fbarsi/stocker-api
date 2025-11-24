import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('inventory')
@Unique(['item', 'branch'])
export class Inventory {
  @PrimaryGeneratedColumn()
  inventoryId: number;

  @Column({ name: 'bundle_quantity', type: 'int', default: 0 })
  bundleQuantity: number;

  @Column({ name: 'unit_quantity', type: 'int', default: 0 })
  unitQuantity: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  @ManyToOne(() => Item, (item) => item.inventory)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Branch, (branch) => branch.inventory)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
