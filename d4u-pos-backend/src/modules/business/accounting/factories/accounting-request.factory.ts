import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';

@Injectable()
export class AccountingRequestFactory {
  createPosSaleRequest(storeId: number, orderId: string, amount: number, userId: number): AccountingRequest {
    return {
      tenant_id: 0, // Resolved from context normally
      store_id: storeId,
      business_module: 'POS',
      business_event: 'POS_SALE',
      business_document_id: orderId,
      document_number: `ORD-${orderId}`,
      transaction_date: new Date(),
      user_id: userId,
      reference: `POS Sale Order ${orderId}`,
      amount,
    };
  }

  // Other factories can be added here
}
