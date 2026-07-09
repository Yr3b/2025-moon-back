import { SparePart } from 'src/infraestructure/entities/spare-part/spare-part.entity';
import { PaginatedQueryDto } from 'src/domain/dtos/paginated-query.dto';
import { PaginatedResultDto } from 'src/domain/dtos/paginated-result.dto';
import { IBaseRepository } from './base-repository.interface';
import { ServiceSparePartDto } from 'src/infraestructure/dtos/services/create-service.dto';
import { Service } from 'src/infraestructure/entities/service/service.entity';

export interface CreateSparePartData {
  name: string;
  stock: number;
  price: number;
  mechanicId: number;
}

export interface ISparePartRepository extends IBaseRepository<SparePart> {
  assignSparePartsToService(
    service: Service,
    spareParts: ServiceSparePartDto[],
  ): Promise<void>;
  getByIds(ids: number[]): Promise<SparePart[]>;
  getById(id: number): Promise<SparePart>;
  getPaginated(
    query: PaginatedQueryDto,
    mechanicId: number,
  ): Promise<PaginatedResultDto<SparePart>>;
  createSparePart(data: CreateSparePartData): Promise<SparePart>;
  blockServicesBySparePartId(id: number): Promise<void>;
  removeById(id: number): Promise<void>;
}

export const ISparePartRepositoryToken = 'ISparePartRepository';
