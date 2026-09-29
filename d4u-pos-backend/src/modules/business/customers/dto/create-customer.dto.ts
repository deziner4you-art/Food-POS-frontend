import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateCustomerDto {
  @IsInt()
  @IsOptional()
  brand_id: number;

  // Public website registration supplies the selected branch. The backend
  // derives brand_id from this store; it is never trusted from the request.
  @IsInt()
  @IsOptional()
  store_id?: number;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;
}
