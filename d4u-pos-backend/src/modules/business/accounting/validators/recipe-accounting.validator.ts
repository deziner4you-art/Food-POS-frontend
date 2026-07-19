import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { RecipeConsumptionPayload } from '../interfaces/recipe-consumption.payload';

@Injectable()
export class RecipeAccountingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateConsumption(payload: RecipeConsumptionPayload) {
    if (payload.total_cogs <= 0) {
      throw new BadRequestException(`Invalid COGS amount (${payload.total_cogs}) for Order ${payload.order_id}`);
    }

    if (!payload.ingredients || payload.ingredients.length === 0) {
      throw new BadRequestException(`No ingredients specified for consumption in Order ${payload.order_id}`);
    }

    // Check Duplicate
    const reference = `Recipe Consumption for Order ${payload.order_id}, Product ${payload.product_id}`;
    const duplicate = await this.prisma.voucher.findFirst({
      where: {
        store_id: payload.store_id,
        reference_number: reference,
      }
    });

    if (duplicate) {
      throw new BadRequestException(`Consumption for Order ${payload.order_id}, Product ${payload.product_id} already posted.`);
    }
  }
}
