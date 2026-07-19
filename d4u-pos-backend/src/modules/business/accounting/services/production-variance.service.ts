import { Injectable, Logger } from '@nestjs/common';
import { ProductionCostRepository } from '../repositories/production-cost.repository';
import { ProductionCostValidator } from '../validators/production-cost.validator';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProductionVarianceCalculatedEvent } from '../events/production-variance-calculated.event';
import { VarianceResult } from '../interfaces/production-variance.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { AccountingIntegrationService } from './accounting-integration.service';
import { BusinessModule } from '../enums/business-module.enum';
import { BusinessEvent } from '../enums/business-event.enum';

@Injectable()
export class ProductionVarianceService {
  private readonly logger = new Logger(ProductionVarianceService.name);

  constructor(
    private readonly repository: ProductionCostRepository,
    private readonly validator: ProductionCostValidator,
    private readonly eventBus: DomainEventBusService,
    private readonly prisma: PrismaService,
    private readonly accountingIntegration: AccountingIntegrationService,
  ) {}

  async analyzeVariance(productionId: number, userId: number): Promise<VarianceResult> {
    const order = await this.validator.validateCostingEligibility(productionId);
    
    const cost = await this.prisma.productionCost.findUnique({ where: { production_id: productionId } });
    if (!cost) throw new Error('Cost calculation must run before variance analysis.');

    const yieldRecord = await this.prisma.productionYield.findUnique({ where: { production_id: productionId } });
    if (!yieldRecord) throw new Error('Yield analysis must run before variance analysis.');

    const materialVariance = cost.planned_material_cost - cost.actual_material_cost; // Positive is favorable
    const totalVariance = materialVariance;
    
    const variancePercentage = cost.planned_material_cost > 0 
      ? (totalVariance / cost.planned_material_cost) * 100 
      : 0;
    
    const efficiencyPercentage = cost.actual_material_cost > 0 
      ? (cost.planned_material_cost / cost.actual_material_cost) * 100 
      : 0;

    const varianceData = {
      material_cost_variance: materialVariance,
      total_variance: totalVariance,
      variance_percentage: variancePercentage,
      efficiency_percentage: efficiencyPercentage,
    };

    await this.repository.createOrUpdateVariance(productionId, varianceData);

    const result: VarianceResult = {
      production_id: productionId,
      material_cost_variance: materialVariance,
      quantity_variance: 0,
      total_variance: totalVariance,
      variance_percentage: variancePercentage,
      efficiency_percentage: efficiencyPercentage,
    };

    // If unfavorable (negative), we post an expense
    if (totalVariance !== 0) {
      await this.accountingIntegration.processBusinessEvent({
        tenant_id: 0,
        store_id: order.store_id,
        business_module: BusinessModule.INVENTORY,
        business_event: 'PRODUCTION_VARIANCE' as any,
        business_document_id: order.production_number,
        document_number: order.production_number,
        transaction_date: new Date(),
        user_id: userId,
        reference: `Production Variance: ${order.production_number}`,
        amount: Math.abs(totalVariance), // Engine logic handles Debit/Credit mapped configuration
        metadata: { is_favorable: totalVariance > 0 }
      });
    }

    this.eventBus.publish(new ProductionVarianceCalculatedEvent(order.store_id, 0, userId, productionId.toString(), 'analyzeVariance', result));

    return result;
  }
}
