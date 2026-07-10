import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class ActualItemDto {
  @IsInt()
  @IsPositive()
  itemId: number;

  @IsNumber()
  @Min(0)
  actualQuantity: number;

  @IsInt()
  @Min(0)
  actualUnitPrice: number;
}

export class ConfirmActualsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ActualItemDto)
  items: ActualItemDto[];
}
