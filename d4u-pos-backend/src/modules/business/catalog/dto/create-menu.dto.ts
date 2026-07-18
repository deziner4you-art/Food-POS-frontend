import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsOptional()
  brand_id?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  store_ids?: number[];
}
