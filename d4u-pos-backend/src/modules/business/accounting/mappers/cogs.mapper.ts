import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';

@Injectable()
export class COGSMapper {
  mapCOGSToAccountingRequest(payload: RecipeConsumptionPayload): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: payload.store_id,
      business_module: BusinessModule.ACCOUNTING,
      business_event: 'COGS_POSTING' as any, // Mapped locally if not in enum
      business_document_id: `ORD-${payload.order_id}-COGS`,
      document_number: `COGS-${payload.order_id}-${payload.product_id}`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: `COGS Posting for Order ${payload.order_id}, Product ${payload.product_id}`,
      amount: payload.total_cogs,
      metadata: {
        order_id: payload.order_id,
        product_id: payload.product_id,
      }
    };
  }
}
