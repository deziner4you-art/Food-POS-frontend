import { Injectable, BadRequestException } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PosAccountingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateSale(order: Order) {
    if (order.status !== 'SETTLED') {
      throw new BadRequestException(`Order ${order.id} is not SETTLED. Accounting rejected.`);
    }

    if (order.total_amount <= 0) {
      throw new BadRequestException(`Order ${order.id} has invalid amount: ${order.total_amount}`);
    }

    const reference = `POS Sale Order ${order.id} via ${order.payment_method}`;
    const duplicate = await this.prisma.voucher.findFirst({
      where: {
        store_id: order.store_id,
        reference_number: reference,
      }
    });

    if (duplicate) {
      throw new BadRequestException(`Order ${order.id} already posted to accounting.`);
    }
  }

  async validateRefund(order: Order) {
    if (order.status !== 'SETTLED' && order.status !== 'VOIDED') {
      throw new BadRequestException(`Order ${order.id} cannot be refunded in status: ${order.status}`);
    }
  }

  async validateVoid(order: Order) {
    if (order.status !== 'VOIDED') {
      throw new BadRequestException(`Order ${order.id} is not VOIDED.`);
    }
  }
}
