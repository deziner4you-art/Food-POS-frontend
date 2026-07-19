import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ComplianceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCheck(data: any) {
    return this.prisma.complianceCheck.create({ data });
  }

  async createControl(data: any) {
    return this.prisma.internalControl.create({ data });
  }

  async createFinding(data: any) {
    return this.prisma.auditFinding.create({ data });
  }

  async createGoLiveItem(data: any) {
    return this.prisma.goLiveChecklist.create({ data });
  }

  async createCertification(data: any) {
    return this.prisma.systemCertification.create({ data });
  }

  async clearFindings(storeId: number) {
    return this.prisma.auditFinding.deleteMany({ where: { store_id: storeId } });
  }

  async checkUnbalancedJournals(storeId: number) {
    const journals = await this.prisma.journalEntry.findMany({
      where: { store_id: storeId },
      include: { lines: true }
    });

    const unbalanced = [];
    for (const je of journals) {
      let debit = 0;
      let credit = 0;
      for (const line of je.lines) {
        debit += Number(line.debit_amount || 0);
        credit += Number(line.credit_amount || 0);
      }
      if (Math.abs(debit - credit) > 0.01) {
        unbalanced.push(je.id);
      }
    }
    return unbalanced;
  }

  async getRecentCertifications(storeId: number) {
    return this.prisma.systemCertification.findMany({
      where: { store_id: storeId },
      orderBy: { certification_date: 'desc' },
      take: 1
    });
  }

  async getAllChecks(storeId: number) {
    return this.prisma.complianceCheck.findMany({ where: { store_id: storeId } });
  }
}
