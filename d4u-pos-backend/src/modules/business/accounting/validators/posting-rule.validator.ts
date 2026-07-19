import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

export const SUPPORTED_RULE_TYPES = [
  'POS_SALE',
  'POS_REFUND',
  'INVENTORY_ADJUSTMENT',
  'PURCHASE_INVOICE',
  'PURCHASE_RETURN',
  'CASH_RECEIPT',
  'CASH_PAYMENT',
  'BANK_RECEIPT',
  'BANK_PAYMENT',
  'PAYROLL',
  'SUBSCRIPTION',
  'MANUAL_JOURNAL',
];

@Injectable()
export class PostingRuleValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCreation(storeId: number, dto: any) {
    if (!SUPPORTED_RULE_TYPES.includes(dto.trigger_event)) {
      throw new BadRequestException(`Trigger event ${dto.trigger_event} is not a supported type.`);
    }

    const existing = await this.prisma.postingRule.findFirst({
      where: { store_id: storeId, rule_code: dto.rule_code },
    });
    
    if (existing) {
      throw new BadRequestException('Rule Code must be unique per store.');
    }

    // Ensure negative priority is rejected or something. We'll just enforce standard bounds
    if (dto.priority < 0) {
      throw new BadRequestException('Priority cannot be negative.');
    }
  }

  async validateContext(context: any) {
    if (!context.store_id || !context.event_type) {
      throw new BadRequestException('Posting context missing required store or event_type.');
    }
  }
}
