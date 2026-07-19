import { Injectable, NotImplementedException } from '@nestjs/common';
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
