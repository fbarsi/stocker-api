import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';
import { InventoryMovement } from '../../inventory/entities/inventory_movement.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn()
  branch_id: number;

  @Column({ type: 'varchar', length: 255 })
  branch_name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  @ManyToOne(() => Company, (company) => company.branches)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => Inventory, (inventory) => inventory.branch)
  inventory: Inventory[];

  @OneToMany(() => InventoryMovement, (movement) => movement.branch)
  movements: InventoryMovement[];
}