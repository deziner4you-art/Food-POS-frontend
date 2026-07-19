import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class MonthEndRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClosingSession(storeId: number, periodId: number, userId: number) {
    return this.prisma.monthEndClosing.upsert({
      where: { accounting_period_id: periodId },
      update: {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        executed_by: userId,
        tasks: { deleteMany: {} },
        exceptions: { deleteMany: {} }
      },
      create: {
        store_id: storeId,
        accounting_period_id: periodId,
        status: 'IN_PROGRESS',
        started_at: new Date(),
        executed_by: userId
      },
      include: { tasks: true, exceptions: true }
    });
  }

  async addClosingTask(closingId: number, name: string, status: string, message: string) {
    return this.prisma.closingTask.create({
      data: {
        month_end_closing_id: closingId,
        task_name: name,
        status,
        message,
        executed_at: new Date()
      }
    });
  }

  async addException(closingId: number, entityType: string, entityId: string, description: string, severity: string) {
    return this.prisma.closingException.create({
      data: {
        month_end_closing_id: closingId,
        entity_type: entityType,
        entity_id: entityId,
        description,
        severity
      }
    });
  }

  async completeClosing(closingId: number, status: string) {
    return this.prisma.monthEndClosing.update({
      where: { id: closingId },
      data: { status, completed_at: new Date() },
      include: { tasks: true, exceptions: true }
    });
  }

  async getClosingSession(periodId: number) {
    return this.prisma.monthEndClosing.findUnique({
      where: { accounting_period_id: periodId },
      include: { tasks: true, exceptions: true }
    });
  }
}
