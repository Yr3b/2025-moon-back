import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { BudgetItemKind } from 'src/infraestructure/entities/budget/budget-item-kind.enum';

export class CreateBudgetItemDto {
  @IsEnum(BudgetItemKind)
  kind: BudgetItemKind;

  @ValidateIf((o: CreateBudgetItemDto) => o.kind === BudgetItemKind.SERVICE)
  @IsInt()
  @IsPositive()
  serviceId?: number;

  @ValidateIf((o: CreateBudgetItemDto) => o.kind === BudgetItemKind.SPARE_PART)
  @IsInt()
  @IsPositive()
  sparePartId?: number;

  @ValidateIf(
    (o: CreateBudgetItemDto) =>
      o.kind === BudgetItemKind.LABOR || o.kind === BudgetItemKind.OTHER,
  )
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  unitPrice?: number;
}
