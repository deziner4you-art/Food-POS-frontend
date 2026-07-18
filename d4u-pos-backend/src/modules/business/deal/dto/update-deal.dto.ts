import { IsOptional, IsString } from 'class-validator';

export class UpdateDealDto {
  @IsOptional()
  @IsString()
  title?: string;
}
