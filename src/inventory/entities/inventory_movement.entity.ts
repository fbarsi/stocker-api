import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';

export enum MovementType {
  INBOUND = 'INBOUND',
  SALE = 'SALE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  movementId: number;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({ name: 'bundle_change', type: 'int' })
  bundleChange: number;

  @Column({ name: 'unit_change', type: 'int' })
  unitChange: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => Item, (item) => item.movements)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Branch, (branch) => branch.movements)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @ManyToOne(() => User, (user) => user.movements)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
