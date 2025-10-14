import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from '../companies/company.entity';
import { Inventory } from '../inventory/inventory.entity';
import { InventoryMovement } from '../inventory/inventory_movement.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  item_id: number;

  @Column({ type: 'varchar', length: 255 })
  item_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  units_per_bundle: number;

  @ManyToOne(() => Company, (company) => company.items)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => Inventory, (inventory) => inventory.item)
  inventory: Inventory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.item)
  movements: InventoryMovement[];
}