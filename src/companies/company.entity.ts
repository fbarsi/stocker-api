import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Branch } from '../branches/branch.entity';
import { Item } from '../items/item.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  company_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  company_name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];

  @OneToMany(() => Item, (item) => item.company)
  items: Item[];
}