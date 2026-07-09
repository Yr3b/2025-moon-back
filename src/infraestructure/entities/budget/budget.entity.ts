import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { BudgetItem } from './budget-item.entity';
import { BudgetStatus } from './budget-status.enum';

@Entity('budgets')
export class Budget extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Appointment, { nullable: false })
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ name: 'appointment_id' })
  appointmentId: number;

  @ManyToOne(() => Budget, (budget) => budget.additionals, { nullable: true })
  @JoinColumn({ name: 'parent_budget_id' })
  parentBudget?: Budget | null;

  @Column({ name: 'parent_budget_id', nullable: true })
  parentBudgetId: number | null;

  @OneToMany(() => Budget, (budget) => budget.parentBudget)
  additionals: Budget[];

  @Column({ default: false })
  isAdditional: boolean;

  @Column({
    type: 'enum',
    enum: BudgetStatus,
    default: BudgetStatus.DRAFT,
  })
  status: BudgetStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', default: 0 })
  estimatedTotal: number;

  @Column({ type: 'int', nullable: true })
  actualTotal: number | null;

  @OneToMany(() => BudgetItem, (item) => item.budget, {
    cascade: true,
    eager: true,
  })
  items: BudgetItem[];

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
