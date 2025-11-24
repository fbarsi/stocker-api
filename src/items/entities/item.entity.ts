import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { InventoryMovement } from '../../inventory/entities/inventory_movement.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  itemId: number;

  @Column({ name: 'item_name', type: 'varchar', length: 255 })
  itemName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'units_per_bundle', type: 'int', default: 1 })
  unitsPerBundle: number;

  @ManyToOne(() => Company, (company) => company.items)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Inventory, (inventory) => inventory.item)
  inventory: Inventory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.item)
  movements: InventoryMovement[];
}
