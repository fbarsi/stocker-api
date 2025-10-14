import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('inventory')
@Unique(['item', 'branch']) // Ensures an item appears only once per branch
export class Inventory {
  @PrimaryGeneratedColumn()
  inventory_id: number;

  @Column({ type: 'int', default: 0 })
  bundle_quantity: number;

  @Column({ type: 'int', default: 0 })
  unit_quantity: number;
  
  @UpdateDateColumn()
  last_updated: Date;

  @ManyToOne(() => Item, (item) => item.inventory)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Branch, (branch) => branch.inventory)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}