import { Injectable, Logger } from '@nestjs/common';
import { ProductionCostRepository } from '../repositories/production-cost.repository';
import { ProductionCostValidator } from '../validators/production-cost.validator';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProductionCostCalculatedEvent } from '../events/production-cost-calculated.event';
import { CostResult } from '../interfaces/production-cost.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionCostingService {
  private readonly logger = new Logger(ProductionCostingService.name);

  constructor(
    private readonly repository: ProductionCostRepository,
    private readonly validator: ProductionCostValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly prisma: PrismaService,
  ) {}

  async calculateCost(productionId: number, userId: number): Promise<CostResult> {
    const order = await this.validator.validateCostingEligibility(productionId);

    // Calculate Planned Cost
    let plannedMaterialCost = 0;
    for (const line of order.lines) {
      // Fetch planned unit cost (Simplified, realistically fetched from standard costs)
      const item = await this.prisma.inventoryItem.findUnique({ where: { id: line.product_id } });
      const stdCost = item?.unit_price || 0;
      plannedMaterialCost += line.planned_quantity * stdCost;
    }

    // Calculate Actual Cost
    let actualMaterialCost = 0;
    for (const consumption of order.consumptions) {
      actualMaterialCost += consumption.total_cost;
    }

    const costData = {
      planned_material_cost: plannedMaterialCost,
      actual_material_cost: actualMaterialCost,
      total_planned_cost: plannedMaterialCost, // assuming 0 labor/overhead for now
      total_actual_cost: actualMaterialCost,
    };

    await this.repository.createOrUpdateCost(productionId, costData);

    const result: CostResult = {
      production_id: productionId,
      total_planned_cost: plannedMaterialCost,
      total_actual_cost: actualMaterialCost,
    };

    this.eventBus.publish(new ProductionCostCalculatedEvent(order.store_id, 0, userId, productionId.toString(), 'calculateCost', result));

    return result;
  }
}
