import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { ServiceSparePart } from '../service/service-spare-part.entity';

@Entity('spare_parts')
export class SparePart extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  stock: number;

  @Column({ type: 'int', default: 0 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.spareParts)
  mechanic: User;

  @OneToMany(
    () => ServiceSparePart,
    (serviceSpareParts) => serviceSpareParts.sparePart,
  )
  serviceSpareParts: ServiceSparePart[];
}
