import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

export interface BusinessEventContract {
  module: BusinessModule;
  event: BusinessEvent;
  document_type: string;
  document_id_prefix: string;
  posting_required: boolean;
  approval_required: boolean;
  default_currency: string;
  default_journal_code: string;
  accounting_rule_code: string;
  is_active: boolean;
}
