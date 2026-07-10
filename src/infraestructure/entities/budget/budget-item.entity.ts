import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Budget } from './budget.entity';
import { BudgetItemKind } from './budget-item-kind.enum';
import { Service } from '../service/service.entity';
import { SparePart } from '../spare-part/spare-part.entity';

@Entity('budget_items')
export class BudgetItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Budget, (budget) => budget.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'budget_id' })
  budgetId: number;

  @Column({ type: 'enum', enum: BudgetItemKind })
  kind: BudgetItemKind;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service?: Service | null;

  @Column({ name: 'service_id', nullable: true })
  serviceId: number | null;

  @ManyToOne(() => SparePart, { nullable: true })
  @JoinColumn({ name: 'spare_part_id' })
  sparePart?: SparePart | null;

  @Column({ name: 'spare_part_id', nullable: true })
  sparePartId: number | null;

  @Column()
  description: string;

  @Column({ type: 'float', default: 1 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  estimatedUnitPrice: number;

  @Column({ type: 'int', default: 0 })
  estimatedLineTotal: number;

  @Column({ type: 'float', nullable: true })
  actualQuantity: number | null;

  @Column({ type: 'int', nullable: true })
  actualUnitPrice: number | null;

  @Column({ type: 'int', nullable: true })
  actualLineTotal: number | null;
}
