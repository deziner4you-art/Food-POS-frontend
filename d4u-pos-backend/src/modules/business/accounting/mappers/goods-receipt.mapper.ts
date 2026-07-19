import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class GoodsReceiptMapper {
  mapToAccountingRequest(payload: PurchaseAccountingPayload): AccountingRequest {
    return {
      tenant_id: payload.tenant_id || 0,
      store_id: payload.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: BusinessEvent.GOODS_RECEIPT,
      business_document_id: payload.grn_number || `GRN-${Date.now()}`,
      document_number: payload.grn_number || `GRN-${Date.now()}`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: payload.reference,
      currency_id: payload.currency_id,
      amount: payload.total_amount,
      tax_amount: payload.total_tax,
      metadata: {
        supplier_id: payload.supplier_id,
        warehouse_id: payload.warehouse_id,
        purchase_order_id: payload.purchase_order_id,
      }
    };
  }
}
