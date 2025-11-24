import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Role } from '../../roles/entities/role.entity';
import { InventoryMovement } from '../../inventory/entities/inventory_movement.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastname: string;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Branch, (branch) => branch.users, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => Role, (role) => role.users, { nullable: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => InventoryMovement, (movement) => movement.user)
  movements: InventoryMovement[];
}
