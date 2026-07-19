const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Event
  'events/inventory-valuation-calculated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class InventoryValuationCalculatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'INVENTORY_VALUATION_CALCULATED';
  occurred_at = new Date();
  entity_type = 'VALUATION';

  constructor(
    public store_id: number,
    public tenant_id: number,
    public user_id: number,
    public entity_id: string,
    public correlation_id: string,
    public payload: any,
  ) {}
}
`,

  // Interfaces
  'interfaces/inventory-valuation.interface.ts': `export interface InventoryValuationContext {
  store_id: number;
  warehouse_id: number;
  product_id: number;
  batch_number?: string;
  movement_type: 'CONSUMPTION' | 'DISPOSAL' | 'TRANSFER' | 'SALE';
  quantity: number;
  transaction_date: Date;
  method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST';
}

export interface IValuationStrategy {
  calculateCost(context: InventoryValuationContext): Promise<import('./inventory-cost-result.interface').InventoryCostResult>;
}
`,

  'interfaces/inventory-cost-result.interface.ts': `export interface CostLayer {
  batch_number?: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
}

export interface InventoryCostResult {
  unit_cost: number;
  total_cost: number;
  valuation_method: 'FIFO' | 'WEIGHTED_AVERAGE' | 'STANDARD_COST';
  cost_layers: CostLayer[];
}
`,

  // Validator
  'validators/inventory-valuation.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { InventoryValuationContext } from '../interfaces/inventory-valuation.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryValuationValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateContext(context: InventoryValuationContext) {
    if (context.quantity <= 0) {
      throw new BadRequestException('Valuation quantity must be positive.');
    }

    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: context.product_id }
    });

    if (!item) {
      throw new BadRequestException(\`Inventory item \${context.product_id} not found.\`);
    }

    if (item.quantity < context.quantity) {
      throw new BadRequestException(\`Insufficient stock for valuation. Available: \${item.quantity}, Requested: \${context.quantity}\`);
    }

    // Additional batch validations could be added here
  }
}
`,

  // Strategies
  'strategies/fifo.strategy.ts': `import { Injectable, NotImplementedException } from '@nestjs/common';
import { IValuationStrategy, InventoryValuationContext } from '../interfaces/inventory-valuation.interface';
import { InventoryCostResult } from '../interfaces/inventory-cost-result.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FIFOStrategy implements IValuationStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCost(context: InventoryValuationContext): Promise<InventoryCostResult> {
    // In a fully implemented FIFO system, we would query Cost Layers ordered by date ASC.
    // Since Cost Layers are not in the current DB schema, we fallback to unit_price as mock.
    
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: context.product_id } });
    const cost = item?.unit_price || 0;
    
    return {
      unit_cost: cost,
      total_cost: cost * context.quantity,
      valuation_method: 'FIFO',
      cost_layers: [
        {
          quantity_used: context.quantity,
          unit_cost: cost,
          total_cost: cost * context.quantity,
          batch_number: context.batch_number || 'DEFAULT',
        }
      ]
    };
  }
}
`,

  'strategies/weighted-average.strategy.ts': `import { Injectable } from '@nestjs/common';
import { IValuationStrategy, InventoryValuationContext } from '../interfaces/inventory-valuation.interface';
import { InventoryCostResult } from '../interfaces/inventory-cost-result.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class WeightedAverageStrategy implements IValuationStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCost(context: InventoryValuationContext): Promise<InventoryCostResult> {
    // Unit price on InventoryItem represents Moving Average
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: context.product_id } });
    const movingAverageCost = item?.unit_price || 0;

    return {
      unit_cost: movingAverageCost,
      total_cost: movingAverageCost * context.quantity,
      valuation_method: 'WEIGHTED_AVERAGE',
      cost_layers: [
        {
          quantity_used: context.quantity,
          unit_cost: movingAverageCost,
          total_cost: movingAverageCost * context.quantity,
        }
      ]
    };
  }
}
`,

  'strategies/standard-cost.strategy.ts': `import { Injectable } from '@nestjs/common';
import { IValuationStrategy, InventoryValuationContext } from '../interfaces/inventory-valuation.interface';
import { InventoryCostResult } from '../interfaces/inventory-cost-result.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class StandardCostStrategy implements IValuationStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async calculateCost(context: InventoryValuationContext): Promise<InventoryCostResult> {
    // In standard cost, we might have a separate catalog for standard costs
    const item = await this.prisma.inventoryItem.findUnique({ where: { id: context.product_id } });
    const standardCost = item?.unit_price || 0; // Using unit_price as standard proxy

    return {
      unit_cost: standardCost,
      total_cost: standardCost * context.quantity,
      valuation_method: 'STANDARD_COST',
      cost_layers: [
        {
          quantity_used: context.quantity,
          unit_cost: standardCost,
          total_cost: standardCost * context.quantity,
        }
      ]
    };
  }
}
`,

  // Engine Service
  'services/inventory-valuation.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    this.logger.log(\`Calculating inventory valuation for Product \${context.product_id} using \${context.method}\`);

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
        throw new BadRequestException(\`Unknown valuation method: \${context.method}\`);
    }

    // 3. Publish Event
    this.eventBus.publish(new InventoryValuationCalculatedEvent(
      context.store_id, 0, userId, context.product_id.toString(), 'valuation', { context, result }
    ));

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
