import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PeriodClosingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getClosingByPeriod(storeId: number, periodId: number) {
    return this.prisma.periodClosing.findFirst({
      where: { store_id: storeId, accounting_period_id: periodId },
      include: { checklists: true, logs: true }
    });
  }

  async getClosingById(id: number) {
    return this.prisma.periodClosing.findUnique({
      where: { id },
      include: { checklists: true, logs: true, accounting_period: true }
    });
  }

  async createOrUpdateClosing(storeId: number, fiscalYearId: number, periodId: number, status: string, userId: number) {
    return this.prisma.periodClosing.upsert({
      where: { accounting_period_id: periodId },
      update: { status },
      create: {
        store_id: storeId,
        fiscal_year_id: fiscalYearId,
        accounting_period_id: periodId,
        status: status,
        opened_by: userId,
      }
    });
  }

  async updateClosing(id: number, data: any) {
    return this.prisma.periodClosing.update({
      where: { id },
      data
    });
  }

  async upsertChecklist(closingId: number, moduleName: string, status: string, message: string, userId: number) {
    // Find first, update if exists, otherwise create
    const existing = await this.prisma.closingChecklist.findFirst({
      where: { closing_id: closingId, module: moduleName }
    });

    if (existing) {
      return this.prisma.closingChecklist.update({
        where: { id: existing.id },
        data: { status, validation_message: message, validated_at: new Date(), validated_by: userId }
      });
    } else {
      return this.prisma.closingChecklist.create({
        data: {
          closing_id: closingId,
          module: moduleName,
          status,
          validation_message: message,
          validated_at: new Date(),
          validated_by: userId
        }
      });
    }
  }

  async addLog(closingId: number, action: string, oldStatus: string | null, newStatus: string | null, reason: string | null, userId: number) {
    return this.prisma.closingLog.create({
      data: {
        closing_id: closingId,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        reason,
        performed_by: userId,
      }
    });
  }
}
