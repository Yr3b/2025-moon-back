import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CostControlRow,
  CostControlSummary,
  IBudgetService,
} from 'src/domain/interfaces/budget-service.interface';
import {
  type IBudgetRepository,
  IBudgetRepositoryToken,
  CreateBudgetItemData,
} from 'src/infraestructure/repositories/interfaces/budget-repository.interface';
import {
  type IAppointmentService,
  IAppointmentServiceToken,
} from 'src/domain/interfaces/appointment-service.interface';
import {
  type IServiceService,
  IServiceServiceToken,
} from 'src/domain/interfaces/service-service.interface';
import {
  type ISparePartService,
  ISparePartServiceToken,
} from 'src/domain/interfaces/spare-part-service.interface';
import { Budget } from 'src/infraestructure/entities/budget/budget.entity';
import { BudgetItem } from 'src/infraestructure/entities/budget/budget-item.entity';
import { BudgetStatus } from 'src/infraestructure/entities/budget/budget-status.enum';
import { BudgetItemKind } from 'src/infraestructure/entities/budget/budget-item-kind.enum';
import { Appointment } from 'src/infraestructure/entities/appointment/appointment.entity';
import { AppointmentStatus } from 'src/infraestructure/entities/appointment/appointment-status.enum';
import { JwtPayload } from 'src/infraestructure/dtos/shared/jwt-payload.interface';
import { CreateBudgetDto } from 'src/infraestructure/dtos/budget/create-budget.dto';
import { CreateBudgetItemDto } from 'src/infraestructure/dtos/budget/create-budget-item.dto';
import { ConfirmActualsDto } from 'src/infraestructure/dtos/budget/confirm-actuals.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BUDGET_EVENTS } from 'src/domain/events/budgets/budget-events';
import { BudgetSentEvent } from 'src/domain/events/budgets/budget-sent-event';
import { BudgetRespondedEvent } from 'src/domain/events/budgets/budget-responded-event';

@Injectable()
export class BudgetService implements IBudgetService {
  constructor(
    @Inject(IBudgetRepositoryToken)
    private readonly repository: IBudgetRepository,
    @Inject(IAppointmentServiceToken)
    private readonly appointmentService: IAppointmentService,
    @Inject(IServiceServiceToken)
    private readonly serviceService: IServiceService,
    @Inject(ISparePartServiceToken)
    private readonly sparePartService: ISparePartService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createBudget(
    workshop: JwtPayload,
    appointmentId: number,
    dto: CreateBudgetDto,
  ): Promise<Budget> {
    const appointment = await this.getWorkshopAppointment(
      appointmentId,
      workshop,
    );
    this.assertAppointmentAcceptsBudgetChanges(appointment.status);

    const existing = await this.repository.findByAppointmentId(appointment.id);
    if (existing.some((b) => !b.isAdditional)) {
      throw new BadRequestException(
        'This appointment already has a budget. Add additionals instead.',
      );
    }

    const { items, estimatedTotal } = await this.buildItems(dto.items);
    return this.repository.createBudget({
      appointmentId: appointment.id,
      isAdditional: false,
      parentBudgetId: null,
      notes: dto.notes ?? null,
      estimatedTotal,
      items,
    });
  }

  async updateBudget(
    workshop: JwtPayload,
    budgetId: number,
    dto: CreateBudgetDto,
  ): Promise<Budget> {
    const budget = await this.getWorkshopBudget(budgetId, workshop);
    this.assertAppointmentAcceptsBudgetChanges(budget.appointment.status);
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('Only draft budgets can be edited');
    }

    const { items, estimatedTotal } = await this.buildItems(dto.items);

    // Reemplazo total de los ítems del presupuesto.
    await BudgetItem.delete({ budgetId: budget.id });
    budget.items = items.map((data) =>
      BudgetItem.create({ ...data, budgetId: budget.id }),
    );
    budget.notes = dto.notes ?? null;
    budget.estimatedTotal = estimatedTotal;
    await this.repository.save(budget);

    return this.getById(budget.id);
  }

  async sendBudget(workshop: JwtPayload, budgetId: number): Promise<Budget> {
    const budget = await this.getWorkshopBudget(budgetId, workshop);
    this.assertAppointmentAcceptsBudgetChanges(budget.appointment.status);
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('Only draft budgets can be sent');
    }
    budget.status = BudgetStatus.SENT;
    budget.sentAt = new Date();
    await this.repository.save(budget);
    this.eventEmitter.emit(BUDGET_EVENTS.SENT, new BudgetSentEvent(budget));
    return this.getById(budget.id);
  }

  async respondBudget(
    user: JwtPayload,
    budgetId: number,
    approve: boolean,
  ): Promise<Budget> {
    const budget = await this.getExistingBudget(budgetId);
    if (budget.appointment.user.id !== user.id) {
      throw new UnauthorizedException('Not authorized to respond this budget');
    }
    if (budget.status !== BudgetStatus.SENT) {
      throw new BadRequestException(
        'Only budgets sent to the client can be approved or rejected',
      );
    }
    if (approve) {
      budget.status = BudgetStatus.APPROVED;
      budget.approvedAt = new Date();
    } else {
      budget.status = BudgetStatus.REJECTED;
      budget.rejectedAt = new Date();
    }
    await this.repository.save(budget);
    await this.recomputeAppointmentBilling(budget.appointmentId);
    this.eventEmitter.emit(
      BUDGET_EVENTS.RESPONDED,
      new BudgetRespondedEvent(budget, approve),
    );
    return this.getById(budget.id);
  }

  async addAdditional(
    workshop: JwtPayload,
    appointmentId: number,
    dto: CreateBudgetDto,
  ): Promise<Budget> {
    const appointment = await this.getWorkshopAppointment(
      appointmentId,
      workshop,
    );
    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'No se pueden agregar adicionales a un turno cancelado o completado.',
      );
    }

    const budgets = await this.repository.findByAppointmentId(appointment.id);
    const original = budgets.find((b) => !b.isAdditional);
    if (!original) {
      throw new BadRequestException(
        'Create the main budget before adding additionals',
      );
    }

    const { items, estimatedTotal } = await this.buildItems(dto.items);
    return this.repository.createBudget({
      appointmentId: appointment.id,
      isAdditional: true,
      parentBudgetId: original.id,
      notes: dto.notes ?? null,
      estimatedTotal,
      items,
    });
  }

  async confirmActuals(
    workshop: JwtPayload,
    budgetId: number,
    dto: ConfirmActualsDto,
  ): Promise<Budget> {
    const budget = await this.getWorkshopBudget(budgetId, workshop);
    if (budget.status !== BudgetStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved budgets can be billed with real costs',
      );
    }
    const appointmentStatus = budget.appointment.status;
    if (
      appointmentStatus !== AppointmentStatus.SERVICE_COMPLETED &&
      appointmentStatus !== AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Real costs can only be confirmed once the service is completed',
      );
    }

    const itemsById = new Map(budget.items.map((item) => [item.id, item]));
    for (const actual of dto.items) {
      const item = itemsById.get(actual.itemId);
      if (!item) {
        throw new BadRequestException(
          `Item ${actual.itemId} does not belong to this budget`,
        );
      }
      item.actualQuantity = actual.actualQuantity;
      item.actualUnitPrice = actual.actualUnitPrice;
      item.actualLineTotal = Math.round(
        actual.actualQuantity * actual.actualUnitPrice,
      );
    }

    budget.actualTotal = budget.items.reduce(
      (sum, item) => sum + (item.actualLineTotal ?? 0),
      0,
    );
    await this.repository.save(budget);
    await this.recomputeAppointmentBilling(budget.appointmentId);
    return this.getById(budget.id);
  }

  async deleteBudget(workshop: JwtPayload, budgetId: number): Promise<void> {
    const budget = await this.getWorkshopBudget(budgetId, workshop);
    if (budget.status !== BudgetStatus.DRAFT) {
      throw new BadRequestException('Only draft budgets can be deleted');
    }
    await this.repository.removeById(budget.id);
  }

  async getById(id: number): Promise<Budget> {
    const budget = await this.repository.findById(id);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  getByAppointment(appointmentId: number): Promise<Budget[]> {
    return this.repository.findByAppointmentId(appointmentId);
  }

  async getWorkshopCostControl(
    workshopId: number,
  ): Promise<CostControlSummary> {
    const budgets = (
      await this.repository.getBudgetsOfWorkshop(workshopId)
    ).filter((b) => b.status === BudgetStatus.APPROVED);

    const byAppointment = new Map<number, Budget[]>();
    for (const budget of budgets) {
      const group = byAppointment.get(budget.appointmentId) ?? [];
      group.push(budget);
      byAppointment.set(budget.appointmentId, group);
    }

    const rows: CostControlRow[] = Array.from(byAppointment.values()).map(
      (group) => {
        const appointment = group[0].appointment;
        const additionals = group.filter((b) => b.isAdditional);
        const estimatedTotal = group.reduce(
          (sum, b) => sum + b.estimatedTotal,
          0,
        );

        const actualTotal = appointment?.billedTotal ?? null;
        const difference =
          actualTotal === null ? null : actualTotal - estimatedTotal;

        return {
          appointmentId: group[0].appointmentId,
          date: String(appointment?.date ?? ''),
          time: appointment?.time ?? '',
          appointmentStatus: appointment?.status ?? '',
          clientName: appointment?.user?.fullName ?? '',
          vehiclePlate: appointment?.vehicle?.licensePlate,
          additionalsCount: additionals.length,
          estimatedTotal,
          actualTotal,
          difference,
        };
      },
    );

    rows.sort((a, b) => b.appointmentId - a.appointmentId);

    const totalEstimated = rows.reduce((s, r) => s + r.estimatedTotal, 0);
    const totalActual = rows.reduce((s, r) => s + (r.actualTotal ?? 0), 0);
    const totalDifference = rows.reduce((s, r) => s + (r.difference ?? 0), 0);
    return {
      rows,
      totalEstimated,
      totalActual,
      totalDifference,
    };
  }

  private async recomputeAppointmentBilling(
    appointmentId: number,
  ): Promise<void> {
    const budgets = await this.repository.findByAppointmentId(appointmentId);
    const approved = budgets.filter((b) => b.status === BudgetStatus.APPROVED);
    if (approved.length === 0) return;

    const estimatedTotal = approved.reduce(
      (sum, b) => sum + b.estimatedTotal,
      0,
    );

    const appointment = await this.appointmentService.findById(appointmentId);
    let billedTotal = appointment.billedTotal ?? null;

    const allItemized = approved.every((b) => b.actualTotal !== null);
    if (allItemized) {
      billedTotal = approved.reduce((sum, b) => sum + (b.actualTotal ?? 0), 0);
    }

    const finalPrice = billedTotal ?? estimatedTotal;
    await this.appointmentService.updateBilling(
      appointmentId,
      billedTotal,
      finalPrice,
    );
  }

  async billTurnoTotal(
    workshop: JwtPayload,
    appointmentId: number,
    total: number,
  ): Promise<void> {
    const appointment = await this.getWorkshopAppointment(
      appointmentId,
      workshop,
    );
    if (
      appointment.status !== AppointmentStatus.SERVICE_COMPLETED &&
      appointment.status !== AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'El cobro final se registra una vez completado el servicio.',
      );
    }

    const budgets = await this.repository.findByAppointmentId(appointmentId);
    const approved = budgets.filter((b) => b.status === BudgetStatus.APPROVED);
    if (approved.length === 0) {
      throw new BadRequestException(
        'El turno no tiene un presupuesto aprobado para facturar.',
      );
    }

    await this.appointmentService.updateBilling(appointmentId, total, total);
  }

  private async buildItems(
    dtoItems: CreateBudgetItemDto[],
  ): Promise<{ items: CreateBudgetItemData[]; estimatedTotal: number }> {
    const serviceIds = dtoItems
      .filter((i) => i.kind === BudgetItemKind.SERVICE && i.serviceId)
      .map((i) => i.serviceId as number);
    const sparePartIds = dtoItems
      .filter((i) => i.kind === BudgetItemKind.SPARE_PART && i.sparePartId)
      .map((i) => i.sparePartId as number);

    const services = serviceIds.length
      ? await this.serviceService.getByIds(serviceIds)
      : [];
    const spareParts = sparePartIds.length
      ? await this.sparePartService.getByIds(sparePartIds)
      : [];

    const items: CreateBudgetItemData[] = dtoItems.map((dto) =>
      this.buildItem(dto, services, spareParts),
    );
    const estimatedTotal = items.reduce(
      (sum, item) => sum + item.estimatedLineTotal,
      0,
    );
    return { items, estimatedTotal };
  }

  private buildItem(
    dto: CreateBudgetItemDto,
    services: { id: number; name: string; price: number }[],
    spareParts: { id: number; name: string; price: number }[],
  ): CreateBudgetItemData {
    let description: string;
    let unitPrice: number;
    let serviceId: number | null = null;
    let sparePartId: number | null = null;

    switch (dto.kind) {
      case BudgetItemKind.SERVICE: {
        const service = services.find((s) => s.id === dto.serviceId);
        if (!service) {
          throw new NotFoundException(`Service ${dto.serviceId} not found`);
        }
        serviceId = service.id;
        description = service.name;
        unitPrice = dto.unitPrice ?? service.price;
        break;
      }
      case BudgetItemKind.SPARE_PART: {
        const part = spareParts.find((p) => p.id === dto.sparePartId);
        if (!part) {
          throw new NotFoundException(
            `Spare part ${dto.sparePartId} not found`,
          );
        }
        sparePartId = part.id;
        description = part.name;
        unitPrice = dto.unitPrice ?? part.price;
        break;
      }
      case BudgetItemKind.LABOR:
      case BudgetItemKind.OTHER: {
        if (!dto.description) {
          throw new BadRequestException(
            'Description is required for labor/other items',
          );
        }
        if (dto.unitPrice === undefined) {
          throw new BadRequestException(
            'Unit price is required for labor/other items',
          );
        }
        description = dto.description;
        unitPrice = dto.unitPrice;
        break;
      }
      default:
        throw new BadRequestException('Invalid budget item kind');
    }

    return {
      kind: dto.kind,
      serviceId,
      sparePartId,
      description,
      quantity: dto.quantity,
      estimatedUnitPrice: unitPrice,
      estimatedLineTotal: Math.round(unitPrice * dto.quantity),
    };
  }

  private assertAppointmentAcceptsBudgetChanges(
    status: AppointmentStatus,
  ): void {
    if (
      status === AppointmentStatus.CANCELLED ||
      status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'No se puede gestionar el presupuesto de un turno cancelado o completado.',
      );
    }
  }

  private async getExistingBudget(budgetId: number): Promise<Budget> {
    const budget = await this.repository.findById(budgetId);
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  private async getWorkshopBudget(
    budgetId: number,
    workshop: JwtPayload,
  ): Promise<Budget> {
    const budget = await this.getExistingBudget(budgetId);
    if (budget.appointment.workshop.id !== workshop.id) {
      throw new UnauthorizedException('Not authorized to manage this budget');
    }
    return budget;
  }

  private async getWorkshopAppointment(
    appointmentId: number,
    workshop: JwtPayload,
  ): Promise<Appointment> {
    const appointment = await this.appointmentService.findById(appointmentId);
    if (appointment.workshop.id !== workshop.id) {
      throw new UnauthorizedException(
        'Not authorized to manage budgets for this appointment',
      );
    }
    return appointment;
  }
}
