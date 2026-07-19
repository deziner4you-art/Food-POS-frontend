import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class UpdatePostingRuleDto {
  @IsOptional()
  @IsString()
  rule_name?: string;

  @IsOptional()
  @IsString()
  trigger_event?: string;

  @IsOptional()
  @IsString()
  debit_account_resolver?: string;

  @IsOptional()
  @IsString()
  credit_account_resolver?: string;

  @IsOptional()
  @IsString()
  currency_strategy?: string;

  @IsOptional()
  @IsString()
  tax_strategy?: string;

  @IsOptional()
  @IsString()
  cost_center_strategy?: string;

  @IsOptional()
  @IsString()
  profit_center_strategy?: string;

  @IsOptional()
  @IsBoolean()
  auto_post?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}
