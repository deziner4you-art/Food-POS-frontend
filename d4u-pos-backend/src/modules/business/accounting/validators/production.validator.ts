import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class ProductionValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  async validateNewOrder(productionNumber: string, targetProductId: number) {
    const existing = await this.prisma.productionOrder.findUnique({
      where: { production_number: productionNumber }
    });

    if (existing) {
      throw new BadRequestException(`Duplicate production number (${productionNumber}) prohibited.`);
    }

    const product = await this.prisma.product.findUnique({ where: { id: targetProductId }, include: { recipe: { include: { ingredients: true } } } });
    if (!product || !product.recipe || product.recipe.ingredients.length === 0) {
      throw new BadRequestException('Target product must have a valid recipe configured.');
    }

    return product;
  }

  async validateConsumption(storeId: number, productId: number, quantity: number, warehouseId?: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Consumption quantity must be positive.');
    }

    const balanceResult = await this.ledgerService.getCurrentBalance(storeId, productId);
    if (balanceResult.current_balance < quantity) {
      throw new BadRequestException(`Insufficient available stock for production consumption. Available: ${balanceResult.current_balance}, Requested: ${quantity}`);
    }
  }

  async validateCompletion(producedQuantity: number) {
    if (producedQuantity < 0) {
      throw new BadRequestException('Cannot produce negative quantity.');
    }
  }
}
