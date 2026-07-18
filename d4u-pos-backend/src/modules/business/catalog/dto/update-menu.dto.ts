import { IsString, IsInt, IsOptional, IsArray } from 'class-validator';

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  store_ids?: number[];
}
