import { IsBoolean } from 'class-validator';

export class RespondBudgetDto {
  @IsBoolean()
  approve: boolean;
}
