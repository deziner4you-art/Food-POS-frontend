import { BusinessEvent } from '../enums/business-event.enum';

export interface AccountingEventContract {
  event: BusinessEvent;
  voucher_type_code: string;
  journal_type_code: string;
  required_system_accounts: string[];
  auto_posting: boolean;
  approval_workflow_code: string;
}
