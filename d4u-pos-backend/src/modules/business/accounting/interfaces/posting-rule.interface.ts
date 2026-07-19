export interface PostingRule {
  id: number;
  rule_code: string;
  rule_name: string;
  trigger_event: string;
  debit_account_resolver: string;
  credit_account_resolver: string;
  currency_strategy: string;
  tax_strategy: string;
  cost_center_strategy?: string;
  profit_center_strategy?: string;
  auto_post: boolean;
  is_active: boolean;
  priority: number;
}
