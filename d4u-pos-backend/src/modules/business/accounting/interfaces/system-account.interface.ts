import { SystemAccountType } from '../enums/system-account-type.enum';

export interface ISystemAccountMapping {
  id: number;
  store_id: number;
  mapping_type: SystemAccountType;
  account_id: number;
  created_at: Date;
  updated_at: Date;
}
