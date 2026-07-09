import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class UpdateSparePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  stock: number;

  @IsNumber()
  @Min(0)
  price: number;
}
