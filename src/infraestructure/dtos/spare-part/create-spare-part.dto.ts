import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { IsGreaterThanZero } from 'src/infraestructure/rest-api/decorators/is-greater-than-zero-decorator';
export class CreateSparePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsGreaterThanZero()
  stock: number;

  @IsNumber()
  @Min(0)
  price: number;
}
