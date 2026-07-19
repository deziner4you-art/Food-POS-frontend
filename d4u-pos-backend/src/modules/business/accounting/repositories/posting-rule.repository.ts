import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostingRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: Omit<Prisma.PostingRuleUncheckedCreateInput, 'store_id'>) {
    return this.prisma.postingRule.create({
      data: { ...data, store_id: storeId },
    });
  }

  async update(storeId: number, id: number, data: Prisma.PostingRuleUncheckedUpdateInput) {
    return this.prisma.postingRule.update({
      where: { id, store_id: storeId },
      data,
    });
  }

  async findByCode(storeId: number, ruleCode: string) {
    return this.prisma.postingRule.findUnique({
      where: { store_id_rule_code: { store_id: storeId, rule_code: ruleCode } },
    });
  }

  async findActiveRulesByTrigger(storeId: number, triggerEvent: string) {
    return this.prisma.postingRule.findMany({
      where: { store_id: storeId, trigger_event: triggerEvent, is_active: true },
      orderBy: { priority: 'desc' },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.postingRule.findMany({
      where: { store_id: storeId },
      orderBy: { priority: 'desc' },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.postingRule.findFirst({
      where: { id, store_id: storeId },
    });
  }
}
