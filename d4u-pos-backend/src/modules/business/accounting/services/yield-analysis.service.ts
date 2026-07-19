import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductionCostRepository } from '../repositories/production-cost.repository';
import { ProductionCostValidator } from '../validators/production-cost.validator';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { YieldAnalysisCompletedEvent } from '../events/yield-analysis-completed.event';
import { YieldResult } from '../interfaces/yield-result.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class YieldAnalysisService {
  private readonly logger = new Logger(YieldAnalysisService.name);

  constructor(
    private readonly repository: ProductionCostRepository,
    private readonly validator: ProductionCostValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly prisma: PrismaService,
  ) {}

  async calculateYield(productionId: number, userId: number): Promise<YieldResult> {
    const order = await this.validator.validateCostingEligibility(productionId);

    const expectedYield = order.planned_quantity;
    const actualYield = order.produced_quantity;

    if (actualYield < 0) throw new BadRequestException('No negative yield allowed.');

    const yieldPercentage = expectedYield > 0 ? (actualYield / expectedYield) * 100 : 0;
    const lossQuantity = expectedYield > actualYield ? expectedYield - actualYield : 0;

    const yieldData = {
      planned_quantity: order.planned_quantity,
      actual_quantity: order.produced_quantity,
      expected_yield: expectedYield,
      actual_yield: actualYield,
      yield_percentage: yieldPercentage,
      loss_quantity: lossQuantity,
      scrap_quantity: order.scrap_quantity,
    };

    await this.repository.createOrUpdateYield(productionId, yieldData);

    const result: YieldResult = {
      production_id: productionId,
      expected_yield: expectedYield,
      actual_yield: actualYield,
      yield_percentage: yieldPercentage,
      loss_quantity: lossQuantity,
    };

    this.eventBus.publish(new YieldAnalysisCompletedEvent(order.store_id, 0, userId, productionId.toString(), 'calculateYield', result));

    return result;
  }
}
