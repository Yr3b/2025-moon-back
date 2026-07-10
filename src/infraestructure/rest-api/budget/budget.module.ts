import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetController } from './budget.controller';
import { Budget } from 'src/infraestructure/entities/budget/budget.entity';
import { BudgetItem } from 'src/infraestructure/entities/budget/budget-item.entity';
import { IBudgetServiceToken } from 'src/domain/interfaces/budget-service.interface';
import { BudgetService } from 'src/domain/services/budget/budget.service';
import { IBudgetRepositoryToken } from 'src/infraestructure/repositories/interfaces/budget-repository.interface';
import { BudgetRepository } from 'src/infraestructure/repositories/budget.repository';
import { AppointmentModule } from '../appointment/appointment.module';
import { ServiceModule } from '../service/service.module';
import { SparePartModule } from '../spare-part/spare-part.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetItem]),
    AppointmentModule,
    ServiceModule,
    SparePartModule,
  ],
  controllers: [BudgetController],
  providers: [
    { provide: IBudgetServiceToken, useClass: BudgetService },
    { provide: IBudgetRepositoryToken, useClass: BudgetRepository },
  ],
  exports: [IBudgetServiceToken],
})
export class BudgetModule {}
