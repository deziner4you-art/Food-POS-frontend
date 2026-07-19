import { IsOptional, IsString } from 'class-validator';

export class ApproveVoucherDto {
  @IsOptional()
  @IsString()
  approval_notes?: string;
}
