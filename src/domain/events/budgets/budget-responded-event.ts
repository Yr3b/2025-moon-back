import { Budget } from 'src/infraestructure/entities/budget/budget.entity';
import { User } from 'src/infraestructure/entities/user/user.entity';

export class BudgetRespondedEvent {
  constructor(
    public readonly budget: Budget,
    public readonly approved: boolean,
  ) {}

  getRecipient(): User {
    return this.budget.appointment.workshop;
  }

  getMessage(): string {
    const b = this.budget;
    const client = b.appointment.user?.fullName || 'El cliente';
    const kind = b.isAdditional ? 'el adicional' : 'el presupuesto';
    const verb = this.approved ? 'aprobó' : 'rechazó';
    const icon = this.approved ? '✅' : '❌';
    return `${icon} ${client} ${verb} ${kind} del turno #${b.appointmentId}.`;
  }
}
