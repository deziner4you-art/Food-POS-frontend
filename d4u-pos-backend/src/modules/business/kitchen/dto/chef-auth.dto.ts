import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class GenerateChefPinDto {
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @IsString()
  @IsNotEmpty()
  chef_name: string;

  @IsNumber()
  @IsOptional()
  kitchen_station_id?: number;
}

export class ChefLoginDto {
  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsString()
  @IsOptional()
  device_id?: string;

  @IsString()
  @IsOptional()
  device_name?: string;
}

export class ResumeChefSessionDto {
  @IsNumber()
  @IsNotEmpty()
  session_id: number;

  @IsString()
  @IsNotEmpty()
  device_id: string;
}

export class ChefHeartbeatDto {
  @IsNumber()
  @IsNotEmpty()
  session_id: number;
}
