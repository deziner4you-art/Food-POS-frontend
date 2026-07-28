import { IsNumber, IsNotEmpty } from 'class-validator';

export class ReleaseTableDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;
}
