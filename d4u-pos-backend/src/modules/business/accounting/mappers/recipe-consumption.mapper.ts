import { Injectable } from '@nestjs/common';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { BusinessEvent } from '../enums/business-event.enum';
import { BusinessModule } from '../enums/business-module.enum';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';

@Injectable()
export class RecipeConsumptionMapper {
  mapConsumptionToAccountingRequest(payload: RecipeConsumptionPayload): AccountingRequest {
    return {
      tenant_id: 0,
      store_id: payload.store_id,
      business_module: BusinessModule.INVENTORY,
      business_event: BusinessEvent.INVENTORY_CONSUMPTION,
      business_document_id: `ORD-${payload.order_id}-PROD-${payload.product_id}`,
      document_number: `ICNS-${payload.order_id}-${payload.product_id}`,
      transaction_date: payload.transaction_date,
      user_id: payload.created_by,
      reference: `Recipe Consumption for Order ${payload.order_id}, Product ${payload.product_id}`,
      amount: payload.total_cogs,
      metadata: {
        order_id: payload.order_id,
        product_id: payload.product_id,
        ingredients_count: payload.ingredients.length,
      }
    };
  }
}
