import { Injectable, BadRequestException } from '@nestjs/common';
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
      throw new BadRequestException(`Inventory item ${context.product_id} not found.`);
    }

    if (item.quantity < context.quantity) {
      throw new BadRequestException(`Insufficient stock for valuation. Available: ${item.quantity}, Requested: ${context.quantity}`);
    }

    // Additional batch validations could be added here
  }
}
