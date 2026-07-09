import { Budget } from 'src/infraestructure/entities/budget/budget.entity';
import { BudgetItemKind } from 'src/infraestructure/entities/budget/budget-item-kind.enum';
import { IBaseRepository } from './base-repository.interface';

export interface CreateBudgetItemData {
  kind: BudgetItemKind;
  serviceId?: number | null;
  sparePartId?: number | null;
  description: string;
  quantity: number;
  estimatedUnitPrice: number;
  estimatedLineTotal: number;
}

export interface CreateBudgetData {
  appointmentId: number;
  parentBudgetId?: number | null;
  isAdditional: boolean;
  notes?: string | null;
  estimatedTotal: number;
  items: CreateBudgetItemData[];
}

export interface IBudgetRepository extends IBaseRepository<Budget> {
  createBudget(data: CreateBudgetData): Promise<Budget>;
  findById(id: number): Promise<Budget | null>;
  findByAppointmentId(appointmentId: number): Promise<Budget[]>;
  getBudgetsOfWorkshop(workshopId: number): Promise<Budget[]>;
  removeById(id: number): Promise<void>;
}

export const IBudgetRepositoryToken = 'IBudgetRepository';
