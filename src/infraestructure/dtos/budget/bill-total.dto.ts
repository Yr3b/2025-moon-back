import { IsInt, Min } from 'class-validator';

export class BillTotalDto {
  @IsInt()
  @Min(0)
  total: number;
}
