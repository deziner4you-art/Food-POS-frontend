import { IsOptional, IsString } from 'class-validator';

export class CreateDealDto {
  @IsOptional()
  @IsString()
  title?: string;
}
