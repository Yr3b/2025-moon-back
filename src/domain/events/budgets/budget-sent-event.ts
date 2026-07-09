import { Budget } from 'src/infraestructure/entities/budget/budget.entity';
import { User } from 'src/infraestructure/entities/user/user.entity';

export class BudgetSentEvent {
  constructor(public readonly budget: Budget) {}

  getRecipient(): User {
    return this.budget.appointment.user;
  }

  getMessage(): string {
    const b = this.budget;
    const workshop = b.appointment.workshop?.workshopName || 'El taller';
    const kind = b.isAdditional ? 'un presupuesto adicional' : 'un presupuesto';
    const total = (b.estimatedTotal ?? 0).toLocaleString('es-AR');
    return `📄 ${workshop} te envió ${kind} de $${total} para el turno #${b.appointmentId}. Ingresá para aprobarlo o rechazarlo.`;
  }
}
