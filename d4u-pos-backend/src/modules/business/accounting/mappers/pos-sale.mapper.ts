import { Injectable } from '@nestjs/common';
import { Order } from '@prisma/client';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';

@Injectable()
export class PosSaleMapper {
  mapOrderToAccountingRequest(order: Order, taxAmount: number = 0): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: order.store_id,
      business_module: BusinessModule.POS,
      business_event: BusinessEvent.POS_SALE,
      business_document_id: order.id.toString(),
      document_number: `ORD-${order.id}`,
      transaction_date: order.business_date,
      user_id: order.created_by,
      reference: `POS Sale Order ${order.id} via ${order.payment_method}`,
      amount: order.total_amount,
      tax_amount: taxAmount,
      metadata: {
        payment_method: order.payment_method,
        discount: order.discount,
        customer_id: order.customer_id,
      }
    };
  }
}
