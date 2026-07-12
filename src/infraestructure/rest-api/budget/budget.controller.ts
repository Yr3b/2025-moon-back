import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  type IBudgetService,
  IBudgetServiceToken,
} from 'src/domain/interfaces/budget-service.interface';
import { AuthenticatedUser } from '../decorators/authenticated-user.decorator';
import { AuthenticatedWorkshop } from '../decorators/authenticated-mechanic.decorator';
import type { JwtPayload } from 'src/infraestructure/dtos/shared/jwt-payload.interface';
import { CreateBudgetDto } from 'src/infraestructure/dtos/budget/create-budget.dto';
import { RespondBudgetDto } from 'src/infraestructure/dtos/budget/respond-budget.dto';
import { ConfirmActualsDto } from 'src/infraestructure/dtos/budget/confirm-actuals.dto';
import { BillTotalDto } from 'src/infraestructure/dtos/budget/bill-total.dto';

@Controller('budgets')
export class BudgetController {
  constructor(
    @Inject(IBudgetServiceToken)
    private readonly budgetService: IBudgetService,
  ) {}

  @Get('cost-control')
  getCostControl(@AuthenticatedWorkshop() workshop: JwtPayload) {
    return this.budgetService.getWorkshopCostControl(workshop.id);
  }

  @Get('appointment/:appointmentId')
  getByAppointment(
    @AuthenticatedUser() user: JwtPayload,
    @Param('appointmentId', new ParseIntPipe()) appointmentId: number,
  ) {
    return this.budgetService.getByAppointment(user, appointmentId);
  }

  @Post('appointment/:appointmentId')
  createBudget(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('appointmentId', new ParseIntPipe()) appointmentId: number,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.createBudget(workshop, appointmentId, dto);
  }

  @Post('appointment/:appointmentId/additional')
  addAdditional(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('appointmentId', new ParseIntPipe()) appointmentId: number,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.addAdditional(workshop, appointmentId, dto);
  }

  @Post('appointment/:appointmentId/bill-total')
  billTurnoTotal(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('appointmentId', new ParseIntPipe()) appointmentId: number,
    @Body() dto: BillTotalDto,
  ) {
    return this.budgetService.billTurnoTotal(workshop, appointmentId, dto.total);
  }

  @Put(':id')
  updateBudget(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.updateBudget(workshop, id, dto);
  }

  @Post(':id/send')
  sendBudget(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
  ) {
    return this.budgetService.sendBudget(workshop, id);
  }

  @Post(':id/respond')
  respondBudget(
    @AuthenticatedUser() user: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: RespondBudgetDto,
  ) {
    return this.budgetService.respondBudget(user, id, dto.approve);
  }

  @Post(':id/actuals')
  confirmActuals(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: ConfirmActualsDto,
  ) {
    return this.budgetService.confirmActuals(workshop, id, dto);
  }

  @Delete(':id')
  deleteBudget(
    @AuthenticatedWorkshop() workshop: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
  ) {
    return this.budgetService.deleteBudget(workshop, id);
  }

  @Get(':id')
  getById(
    @AuthenticatedUser() user: JwtPayload,
    @Param('id', new ParseIntPipe()) id: number,
  ) {
    return this.budgetService.getByIdForUser(user, id);
  }
}
