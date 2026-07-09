import { DataSource } from 'typeorm';
import { User } from './infraestructure/entities/user/user.entity';
import { UserPasswordRecovery } from './infraestructure/entities/user/password-recovery.entity';
import { Appointment } from './infraestructure/entities/appointment/appointment.entity';
import { Service } from './infraestructure/entities/service/service.entity';
import { ConfigService } from '@nestjs/config';
import { Vehicle } from './infraestructure/entities/vehicle/vehicle.entity';
import { SparePart } from './infraestructure/entities/spare-part/spare-part.entity';
import { ServiceSparePart } from './infraestructure/entities/service/service-spare-part.entity';
import { Notification } from './infraestructure/entities/notification/notification.entity';
import { UserReview } from './infraestructure/entities/user/user-review.entity';
import { Goal } from './infraestructure/entities/goals/goal.entity';
import { DiscountCoupon } from './infraestructure/entities/user/discount-coupon.entity';
import { UserToken } from './infraestructure/entities/user/user-tokens';
import { Budget } from './infraestructure/entities/budget/budget.entity';
import { BudgetItem } from './infraestructure/entities/budget/budget-item.entity';

export const entities = [
  User,
  UserPasswordRecovery,
  UserToken,
  Appointment,
  Service,
  Vehicle,
  ServiceSparePart,
  SparePart,
  Notification,
  UserReview,
  Goal,
  DiscountCoupon,
  Budget,
  BudgetItem,
];

export const createDataSource = (configService: ConfigService) =>
  new DataSource({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST', 'localhost'),
    port: parseInt(configService.getOrThrow<string>('DB_PORT', '5432'), 10),
    username: configService.getOrThrow<string>('DB_USERNAME', 'postgres'),
    password: configService.getOrThrow<string>('DB_PASSWORD', 'postgres'),
    database: configService.getOrThrow<string>('DB_DATABASE', 'estaller'),
    entities,
    synchronize:
      configService.getOrThrow<string>('NODE_ENV', 'development') !==
      'production',
  });

export const AppDataSource = createDataSource(new ConfigService(process.env));
