import { Injectable } from '@nestjs/common';
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
