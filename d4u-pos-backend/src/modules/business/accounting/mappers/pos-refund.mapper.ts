import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';

@Injectable()
export class PosRefundMapper {
  mapRefundToAccountingRequest(order: Order, refundAmount: number, taxRefund: number = 0): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.POS,
      business_event: BusinessEvent.POS_REFUND,
      business_document_id: order.id.toString(),
      document_number: `RFD-${order.id}`,
      transaction_date: new Date(), // Refund happens now
      user_id: order.created_by,
      reference: `POS Refund Order ${order.id} via ${order.payment_method}`,
      amount: refundAmount,
      tax_amount: taxRefund,
      metadata: {
        payment_method: order.payment_method,
      }
    };
  }
}
