import { AccountType } from '../enums/account-type.enum';
import { AccountCategory } from '../enums/account-category.enum';

export interface IAccount {
  id: number;
  store_id: number;
  name: string;
  code: string;
  type: AccountType;
  category: AccountCategory;
  parent_account_id?: number | null;
  currency_id?: number | null;
  is_group: boolean;
  is_active: boolean;
  opening_balance: number;
  created_at: Date;
  updated_at: Date;
}
