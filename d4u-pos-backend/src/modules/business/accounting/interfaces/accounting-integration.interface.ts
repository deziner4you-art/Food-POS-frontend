import { AccountingRequest } from './accounting-request.interface';
import { AccountingResponse } from './accounting-response.interface';

export interface IAccountingIntegration {
  processBusinessEvent(request: AccountingRequest): Promise<AccountingResponse>;
}
