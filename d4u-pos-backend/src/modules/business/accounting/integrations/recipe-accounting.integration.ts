import { Injectable, Logger } from '@nestjs/common';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';
import { RecipeConsumptionMapper } from '../mappers/recipe-consumption.mapper';
import { RecipeAccountingValidator } from '../validators/recipe-accounting.validator';
import { AccountingIntegrationService } from '../services/accounting-integration.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { RecipeConsumedEvent } from '../events/recipe-consumed.event';
import { InventoryConsumptionPostedEvent } from '../events/inventory-consumption-posted.event';

@Injectable()
export class RecipeAccountingIntegration {
  private readonly logger = new Logger(RecipeAccountingIntegration.name);

  constructor(
    private readonly validator: RecipeAccountingValidator,
    private readonly consumptionMapper: RecipeConsumptionMapper,
    private readonly accountingIntegration: AccountingIntegrationService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async postRecipeConsumption(payload: RecipeConsumptionPayload) {
    this.logger.log(`Initiating accounting integration for Recipe Consumption (Order ${payload.order_id})`);
    
    // 1. Validate
    await this.validator.validateConsumption(payload);

    // 2. Map Request
    // Maps to INVENTORY_CONSUMPTION event (Debit: COGS, Credit: Inventory)
    const request = this.consumptionMapper.mapConsumptionToAccountingRequest(payload);

    // 3. Process Integration
    const response = await this.accountingIntegration.processBusinessEvent(request);

    if (response.success) {
      // 4. Publish Events
      this.eventBus.publish(new RecipeConsumedEvent(
        payload.store_id, 0, payload.created_by, `${payload.order_id}-${payload.product_id}`, 'postRecipeConsumption', payload
      ));

      this.eventBus.publish(new InventoryConsumptionPostedEvent(
        payload.store_id, 0, payload.created_by, `${payload.order_id}-${payload.product_id}`, 'postRecipeConsumption', response
      ));
    }

    return response;
  }
}
