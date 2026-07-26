import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @IsString()
  @IsNotEmpty()
  device_id: string;
}

export class SelectWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  assignment_id: string;
}
