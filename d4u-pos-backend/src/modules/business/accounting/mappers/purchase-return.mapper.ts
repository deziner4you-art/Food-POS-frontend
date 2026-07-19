import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class PurchaseReturnMapper {
  mapToAccountingRequest(payload: PurchaseAccountingPayload): AccountingRequest {
    return {
      tenant_id: payload.tenant_id || 0,
      store_id: payload.store_id,
      business_module: BusinessModule.PURCHASING,
      business_event: BusinessEvent.PURCHASE_RETURN,
      business_document_id: payload.return_number || `RET-${Date.now()}`,
      document_number: payload.return_number || `RET-${Date.now()}`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: payload.reference,
      currency_id: payload.currency_id,
      amount: payload.total_amount,
      tax_amount: payload.total_tax,
      metadata: {
        supplier_id: payload.supplier_id,
        purchase_order_id: payload.purchase_order_id,
      }
    };
  }
}
