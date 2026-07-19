import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PurchaseAccountingPayload } from '../interfaces/purchase-accounting.payload';

@Injectable()
export class PurchaseAccountingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validatePayload(payload: PurchaseAccountingPayload) {
    if (payload.total_amount <= 0) {
      throw new BadRequestException(`Invalid amount (${payload.total_amount}) for purchasing transaction`);
    }

    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('No items specified in the purchasing payload.');
    }

    for (const item of payload.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(`Item ${item.item_id} has invalid quantity: ${item.quantity}`);
      }
      if (item.unit_cost < 0) {
        throw new BadRequestException(`Item ${item.item_id} has invalid unit cost: ${item.unit_cost}`);
      }
    }

    // Checking duplicates requires a unique reference. For Purchasing, we can query by reference or document number.
    // The integration service maps the reference to the voucher reference.
    const duplicate = await this.prisma.voucher.findFirst({
      where: {
        store_id: payload.store_id,
        reference_number: payload.reference,
      }
    });

    if (duplicate) {
      throw new BadRequestException(`Duplicate transaction: Accounting entry for ${payload.reference} already exists.`);
    }
  }
}
