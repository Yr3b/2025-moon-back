import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtPayload } from 'src/domain/dtos/jwt-payload.interface';
import { APPOINTMENT_EVENTS } from 'src/domain/events/appointments/appointment-events';
import { AppointmentStatusChangedEvent } from 'src/domain/events/appointments/appointment-status-changed-event';
import { BUDGET_EVENTS } from 'src/domain/events/budgets/budget-events';
import { BudgetSentEvent } from 'src/domain/events/budgets/budget-sent-event';
import { BudgetRespondedEvent } from 'src/domain/events/budgets/budget-responded-event';
import { AppointmentStatus } from 'src/infraestructure/entities/appointment/appointment-status.enum';
import { INotificationService } from 'src/domain/interfaces/notification-service.interface';
import {
  INotificationRepositoryToken,
  type INotificationRepository,
} from 'src/infraestructure/repositories/interfaces/notification-repository.interface';

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @Inject(INotificationRepositoryToken)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  getAllNotifications(user: JwtPayload): Promise<any[]> {
    return this.notificationRepository.findUserNotifications(user.id);
  }

  async markAsRead(user: JwtPayload, notificationId: number): Promise<void> {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user.id !== user.id) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.notificationRepository.markAsRead(notificationId);
  }

  @OnEvent(APPOINTMENT_EVENTS.STATUS_CHANGED)
  async createNotification(event: AppointmentStatusChangedEvent) {
    const message = event.getMessage();
    const userToNotify = event.getUserToNotify();
    if (!message) return;

    await this.notificationRepository.save({
      user: { id: userToNotify.id },
      message,
    });
  }

  @OnEvent(APPOINTMENT_EVENTS.STATUS_CHANGED)
  async createReviewRequestNotification(event: AppointmentStatusChangedEvent) {
    if (event.appointment.status !== AppointmentStatus.COMPLETED) return;

    const appt = event.appointment;
    const reviewMessage = `⭐ Te invitamos a calificar tu turno #${appt.id}.`;

    await this.notificationRepository.save({
      user: { id: appt.user.id },
      message: reviewMessage,
    });
  }

  @OnEvent(BUDGET_EVENTS.SENT)
  async onBudgetSent(event: BudgetSentEvent) {
    await this.notificationRepository.save({
      user: { id: event.getRecipient().id },
      message: event.getMessage(),
    });
  }

  @OnEvent(BUDGET_EVENTS.RESPONDED)
  async onBudgetResponded(event: BudgetRespondedEvent) {
    await this.notificationRepository.save({
      user: { id: event.getRecipient().id },
      message: event.getMessage(),
    });
  }
}
