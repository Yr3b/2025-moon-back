import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Budget } from '../entities/budget/budget.entity';
import { BudgetItem } from '../entities/budget/budget-item.entity';
import {
  CreateBudgetData,
  IBudgetRepository,
} from './interfaces/budget-repository.interface';

@Injectable()
export class BudgetRepository
  extends Repository<Budget>
  implements IBudgetRepository
{
  constructor(private dataSource: DataSource) {
    super(Budget, dataSource.createEntityManager());
  }

  async createBudget(data: CreateBudgetData): Promise<Budget> {
    const items = data.items.map((item) =>
      BudgetItem.create({
        kind: item.kind,
        serviceId: item.serviceId ?? null,
        sparePartId: item.sparePartId ?? null,
        description: item.description,
        quantity: item.quantity,
        estimatedUnitPrice: item.estimatedUnitPrice,
        estimatedLineTotal: item.estimatedLineTotal,
      }),
    );

    const budget = this.create({
      appointmentId: data.appointmentId,
      parentBudgetId: data.parentBudgetId ?? null,
      isAdditional: data.isAdditional,
      notes: data.notes ?? null,
      estimatedTotal: data.estimatedTotal,
      items,
    });

    const saved = await this.save(budget);
    const reloaded = await this.findById(saved.id);
    return reloaded ?? saved;
  }

  findById(id: number): Promise<Budget | null> {
    return this.findOne({
      where: { id },
      relations: [
        'appointment',
        'appointment.workshop',
        'appointment.user',
        'appointment.vehicle',
        'additionals',
      ],
    });
  }

  findByAppointmentId(appointmentId: number): Promise<Budget[]> {
    return this.find({
      where: { appointmentId },
      relations: ['additionals'],
      order: { createdAt: 'ASC' },
    });
  }

  getBudgetsOfWorkshop(workshopId: number): Promise<Budget[]> {
    return this.find({
      where: { appointment: { workshop: { id: workshopId } } },
      relations: [
        'appointment',
        'appointment.user',
        'appointment.vehicle',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async removeById(id: number): Promise<void> {
    const result = await this.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Budget not found');
    }
  }
}
