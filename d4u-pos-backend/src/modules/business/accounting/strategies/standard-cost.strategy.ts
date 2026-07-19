import { Injectable } from '@nestjs/common';
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
