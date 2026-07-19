import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InventoryValuationContext } from '../interfaces/inventory-valuation.interface';
import { InventoryCostResult } from '../interfaces/inventory-cost-result.interface';
import { InventoryValuationValidator } from '../validators/inventory-valuation.validator';
import { FIFOStrategy } from '../strategies/fifo.strategy';
import { WeightedAverageStrategy } from '../strategies/weighted-average.strategy';
import { StandardCostStrategy } from '../strategies/standard-cost.strategy';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { InventoryValuationCalculatedEvent } from '../events/inventory-valuation-calculated.event';

@Injectable()
export class InventoryValuationService {
  private readonly logger = new Logger(InventoryValuationService.name);

  constructor(
    private readonly validator: InventoryValuationValidator,
    private readonly fifoStrategy: FIFOStrategy,
    private readonly weightedAverageStrategy: WeightedAverageStrategy,
    private readonly standardCostStrategy: StandardCostStrategy,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async calculateCost(context: InventoryValuationContext, userId: number): Promise<InventoryCostResult> {
    this.logger.log(`Calculating inventory valuation for Product ${context.product_id} using ${context.method}`);

    // 1. Validate
    await this.validator.validateContext(context);

    // 2. Select Strategy
    let result: InventoryCostResult;
    switch (context.method) {
      case 'FIFO':
        result = await this.fifoStrategy.calculateCost(context);
        break;
      case 'WEIGHTED_AVERAGE':
        result = await this.weightedAverageStrategy.calculateCost(context);
        break;
      case 'STANDARD_COST':
        result = await this.standardCostStrategy.calculateCost(context);
        break;
      default:
        throw new BadRequestException(`Unknown valuation method: ${context.method}`);
    }

    // 3. Publish Event
    this.eventBus.publish(new InventoryValuationCalculatedEvent(
      context.store_id, 0, userId, context.product_id.toString(), 'valuation', { context, result }
    ));

    return result;
  }
}
