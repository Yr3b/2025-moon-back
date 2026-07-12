import { Budget } from 'src/infraestructure/entities/budget/budget.entity';
import { JwtPayload } from 'src/infraestructure/dtos/shared/jwt-payload.interface';
import { CreateBudgetDto } from 'src/infraestructure/dtos/budget/create-budget.dto';
import { ConfirmActualsDto } from 'src/infraestructure/dtos/budget/confirm-actuals.dto';

export interface CostControlRow {
  appointmentId: number;
  date: string;
  time: string;
  appointmentStatus: string;
  clientName: string;
  vehiclePlate?: string;
  additionalsCount: number;
  estimatedTotal: number;
  actualTotal: number | null;
  difference: number | null;
}

export interface CostControlSummary {
  rows: CostControlRow[];
  totalEstimated: number;
  totalActual: number;
  totalDifference: number;
}

export interface IBudgetService {
  createBudget(
    workshop: JwtPayload,
    appointmentId: number,
    dto: CreateBudgetDto,
  ): Promise<Budget>;
  updateBudget(
    workshop: JwtPayload,
    budgetId: number,
    dto: CreateBudgetDto,
  ): Promise<Budget>;
  sendBudget(workshop: JwtPayload, budgetId: number): Promise<Budget>;
  respondBudget(
    user: JwtPayload,
    budgetId: number,
    approve: boolean,
  ): Promise<Budget>;
  addAdditional(
    workshop: JwtPayload,
    appointmentId: number,
    dto: CreateBudgetDto,
  ): Promise<Budget>;
  confirmActuals(
    workshop: JwtPayload,
    budgetId: number,
    dto: ConfirmActualsDto,
  ): Promise<Budget>;
  billTurnoTotal(
    workshop: JwtPayload,
    appointmentId: number,
    total: number,
  ): Promise<void>;
  deleteBudget(workshop: JwtPayload, budgetId: number): Promise<void>;
  getById(id: number): Promise<Budget>;
  getByIdForUser(user: JwtPayload, id: number): Promise<Budget>;
  getByAppointment(user: JwtPayload, appointmentId: number): Promise<Budget[]>;
  getWorkshopCostControl(workshopId: number): Promise<CostControlSummary>;
}

export const IBudgetServiceToken = 'IBudgetService';
