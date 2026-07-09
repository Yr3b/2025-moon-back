import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from 'src/domain/dtos/jwt-payload.interface';
import { PaginatedQueryDto } from 'src/domain/dtos/paginated-query.dto';
import { PaginatedResultDto } from 'src/domain/dtos/paginated-result.dto';
import {
  type IExpenseTrackerService,
  IExpenseTrackerServiceToken,
} from 'src/domain/interfaces/expense-tracker-service.interface';
import {
  ISparePartService,
  ReduceStockData,
} from 'src/domain/interfaces/spare-part-service.interface';
import {
  type IUsersTokenService,
  IUsersTokenServiceToken,
} from 'src/domain/interfaces/users-token-service.interface';
import { ServiceSparePartDto } from 'src/infraestructure/dtos/services/create-service.dto';
import { CreateEntryDto } from 'src/infraestructure/dtos/spare-part/create-entry-body.dto';
import { CreateSparePartDto } from 'src/infraestructure/dtos/spare-part/create-spare-part.dto';
import { UpdateSparePartDto } from 'src/infraestructure/dtos/spare-part/update-spare-part.dto';
import { Service } from 'src/infraestructure/entities/service/service.entity';
import { SparePart } from 'src/infraestructure/entities/spare-part/spare-part.entity';
import { User } from 'src/infraestructure/entities/user/user.entity';
import {
  type ISparePartRepository,
  ISparePartRepositoryToken,
} from 'src/infraestructure/repositories/interfaces/spare-part-repository.interface';

@Injectable()
export class SparePartService implements ISparePartService {
  constructor(
    @Inject(ISparePartRepositoryToken)
    private readonly repository: ISparePartRepository,
    @Inject(IExpenseTrackerServiceToken)
    private readonly expenseTrackerService: IExpenseTrackerService,
    @Inject(IUsersTokenServiceToken)
    private readonly usersTokenService: IUsersTokenService,
  ) {}

  async createEntry(entries: CreateEntryDto[], mechanic: JwtPayload) {
    const token = await this.usersTokenService.getTokenOrThrow(mechanic.id);
    const ids = entries.map((entry) => entry.sparePartId);
    const spareParts = await this.getByIds(ids);
    if (spareParts.length < ids.length)
      throw new NotFoundException('Spare part not found');
    for (const entry of entries) {
      const index = spareParts.findIndex((sp) => sp.id === entry.sparePartId);
      if (index === -1) throw new NotFoundException('Spare part not found');
      spareParts[index].stock += entry.quantity;
    }
    await this.repository.save(spareParts);
    await this.expenseTrackerService.trackOutcome(
      entries.map((entry) => {
        const sparePart = spareParts.find((s) => s.id === entry.sparePartId);
        if (!sparePart) throw new NotFoundException();
        return {
          ...entry,
          sparePart,
        };
      }),
      token,
    );
  }

  getByIds(ids: number[]): Promise<SparePart[]> {
    return this.repository.getByIds(ids);
  }

  async delete(part: SparePart): Promise<void> {
    await this.repository.blockServicesBySparePartId(part.id);
    await this.repository.removeById(part.id);
  }

  async update(part: SparePart, dto: UpdateSparePartDto): Promise<SparePart> {
    part.name = dto.name;
    part.stock = dto.stock;
    part.price = dto.price;
    await this.repository.save(part);
    // @ts-expect-error dont return mechanic so we don't expose user data
    return { ...part, mechanic: undefined };
  }
  create(dto: CreateSparePartDto, mechanic: User): Promise<SparePart> {
    return this.repository.createSparePart({
      ...dto,
      mechanicId: mechanic.id,
    });
  }

  getPaginated(
    query: PaginatedQueryDto,
    mechanic: User,
  ): Promise<PaginatedResultDto<SparePart>> {
    return this.repository.getPaginated(query, mechanic.id);
  }

  getById(id: number): Promise<SparePart> {
    return this.repository.getById(id);
  }

  async reduceStockFromSpareParts(
    stockChanges: ReduceStockData[],
  ): Promise<void> {
    const spareParts = await this.repository.getByIds(
      stockChanges.map((s) => s.sparePartId),
    );
    stockChanges.forEach(({ sparePartId, quantity }) => {
      const sparePart = spareParts.find((sp) => sp.id === sparePartId);
      if (!sparePart) {
        throw new BadRequestException(
          `Spare part with id ${sparePartId} not found`,
        );
      }
      const newStock = sparePart.stock - quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          `Not enough stock for spare part with id ${sparePart.id}`,
        );
      }
      sparePart.stock = newStock;
    });
    await this.repository.save(spareParts);
  }

  async assignSparePartsToService(
    service: Service,
    spareParts: ServiceSparePartDto[],
  ): Promise<void> {
    await this.repository.assignSparePartsToService(service, spareParts);
  }
}
