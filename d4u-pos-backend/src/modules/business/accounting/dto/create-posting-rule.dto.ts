import { IsString, IsBoolean, IsOptional, IsInt, IsNotEmpty } from 'class-validator';

export class CreatePostingRuleDto {
  @IsString()
  @IsNotEmpty()
  rule_code: string;

  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @IsString()
  @IsNotEmpty()
  trigger_event: string;

  @IsString()
  @IsNotEmpty()
  debit_account_resolver: string;

  @IsString()
  @IsNotEmpty()
  credit_account_resolver: string;

  @IsString()
  currency_strategy: string;

  @IsString()
  tax_strategy: string;

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
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;
}
