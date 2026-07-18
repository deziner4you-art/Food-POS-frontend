import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class GenerateLinkDto {
  @IsString()
  @IsNotEmpty()
  affiliate_id: string;

  @IsInt()
  @IsNotEmpty()
  store_id: number;

  @IsString()
  @IsNotEmpty()
  platform: string;
}
