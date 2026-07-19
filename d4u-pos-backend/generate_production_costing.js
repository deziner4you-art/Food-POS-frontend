const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/production-cost-calculated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ProductionCostCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PRODUCTION_COST_CALCULATED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_COST';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/production-variance-calculated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ProductionVarianceCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PRODUCTION_VARIANCE_CALCULATED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_VARIANCE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/yield-analysis-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class YieldAnalysisCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'YIELD_ANALYSIS_COMPLETED';
  occurred_at = new Date();
  entity_type = 'PRODUCTION_YIELD';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/production-cost.interface.ts': `export interface CostResult {
  production_id: number;
  total_planned_cost: number;
  total_actual_cost: number;
}
`,

  'interfaces/production-variance.interface.ts': `export interface VarianceResult {
  production_id: number;
  material_cost_variance: number;
  quantity_variance: number;
  total_variance: number;
  variance_percentage: number;
  efficiency_percentage: number;
}
`,

  'interfaces/yield-result.interface.ts': `export interface YieldResult {
  production_id: number;
  expected_yield: number;
  actual_yield: number;
  yield_percentage: number;
  loss_quantity: number;
}
`,

  // Repository
  'repositories/production-cost.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionCostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateCost(productionId: number, data: any) {
    return this.prisma.productionCost.upsert({
      where: { production_id: productionId },
      update: data,
      create: { production_id: productionId, ...data }
    });
  }

  async createOrUpdateVariance(productionId: number, data: any) {
    return this.prisma.productionVariance.upsert({
      where: { production_id: productionId },
      update: data,
      create: { production_id: productionId, ...data }
    });
  }

  async createOrUpdateYield(productionId: number, data: any) {
    return this.prisma.productionYield.upsert({
      where: { production_id: productionId },
      update: data,
      create: { production_id: productionId, ...data }
    });
  }
}
`,

  // Validator
  'validators/production-cost.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionCostValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCostingEligibility(productionId: number) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: productionId },
      include: { lines: true, consumptions: true, outputs: true, target_product: { include: { recipeItems: true } } }
    });

    if (!order) {
      throw new BadRequestException('Production order not found.');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Production must be completed before variance and costing analysis.');
    }

    if (order.consumptions.length === 0) {
      throw new BadRequestException('Actual consumption required for costing.');
    }

    return order;
  }
}
`,

  // Services
  'services/production-costing.service.ts': `import { Injectable, Logger } from '@nestjs/common';
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
`,

  'services/production-variance.service.ts': `import { Injectable, Logger } from '@nestjs/common';
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
        reference: \`Production Variance: \${order.production_number}\`,
        amount: Math.abs(totalVariance), // Engine logic handles Debit/Credit mapped configuration
        metadata: { is_favorable: totalVariance > 0 }
      });
    }

    this.eventBus.publish(new ProductionVarianceCalculatedEvent(order.store_id, 0, userId, productionId.toString(), 'analyzeVariance', result));

    return result;
  }
}
`,

  'services/yield-analysis.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
