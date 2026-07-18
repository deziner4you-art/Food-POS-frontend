import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class UpdateStoreDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsBoolean()
  @IsOptional()
  is_online?: boolean;

  @IsInt()
  @IsOptional()
  saas_package_id?: number;
}
