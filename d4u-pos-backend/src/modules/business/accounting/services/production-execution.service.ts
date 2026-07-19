import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductionRepository } from '../repositories/production.repository';
import { ProductionValidator } from '../validators/production.validator';
import { ProductionResult } from '../interfaces/production-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProductionStartedEvent } from '../events/production-started.event';
import { ProductionCompletedEvent } from '../events/production-completed.event';
import { ProductionConsumptionService } from './production-consumption.service';
import { ProductionOutputService } from './production-output.service';

@Injectable()
export class ProductionExecutionService {
  private readonly logger = new Logger(ProductionExecutionService.name);

  constructor(
    private readonly repository: ProductionRepository,
    private readonly validator: ProductionValidator,
    private readonly consumptionService: ProductionConsumptionService,
    private readonly outputService: ProductionOutputService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async startProduction(orderId: number, supervisorId: number) {
    const order = await this.repository.getOrder(orderId);
    if (!order || order.status !== 'RELEASED') {
      throw new BadRequestException('Production order must be RELEASED to start.');
    }

    await this.repository.updateOrderStatus(orderId, 'IN_PRODUCTION', { start_time: new Date(), supervisor_id: supervisorId });
    this.eventBus.publish(new ProductionStartedEvent(order.store_id, 0, supervisorId, order.id.toString(), 'startProduction', {}));
  }

  async completeProduction(orderId: number, producedQuantity: number, supervisorId: number): Promise<ProductionResult> {
    const order = await this.repository.getOrder(orderId);
    if (!order || order.status !== 'IN_PRODUCTION') {
      throw new BadRequestException('Production order must be IN_PRODUCTION to complete.');
    }

    await this.validator.validateCompletion(producedQuantity);

    // Process Consumptions automatically based on BOM (Simplified. In advanced implementations, this can be manual per batch)
    let totalCost = 0;
    for (const line of order.lines) {
      // Calculate scaled consumption based on actual produced vs planned, or just consume planned if full completion.
      const factor = producedQuantity / order.planned_quantity;
      const consumedQty = line.planned_quantity * factor;
      
      const cost = await this.consumptionService.consumeLine(order, line, consumedQty, supervisorId);
      totalCost += cost;
    }

    // Process Output (Finished Goods)
    if (producedQuantity > 0) {
      await this.outputService.produceFinishedGoods(order, producedQuantity, totalCost, supervisorId);
    }

    await this.repository.updateOrderStatus(orderId, 'COMPLETED', { end_time: new Date(), produced_quantity: producedQuantity });

    const result: ProductionResult = {
      production_id: order.id,
      production_number: order.production_number,
      status: 'COMPLETED',
      produced_quantity: producedQuantity,
      total_cost: totalCost,
    };

    this.eventBus.publish(new ProductionCompletedEvent(order.store_id, 0, supervisorId, order.id.toString(), 'completeProduction', result));
    
    return result;
  }
}
