import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProductionCostValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCostingEligibility(productionId: number) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: productionId },
      include: { lines: true, consumptions: true, outputs: true, target_product: { include: { recipe: { include: { ingredients: true } } } } }
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
