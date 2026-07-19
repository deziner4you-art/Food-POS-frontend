import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BankReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStatement(data: any) {
    return this.prisma.bankStatement.create({ data, include: { lines: true } });
  }

  async getStatement(id: number) {
    return this.prisma.bankStatement.findUnique({ where: { id }, include: { lines: true } });
  }

  async createReconciliation(data: any) {
    return this.prisma.bankReconciliation.create({ data });
  }

  async updateReconciliationStatus(id: number, status: string, matchedAmount: number, unmatchedAmount: number) {
    return this.prisma.bankReconciliation.update({
      where: { id },
      data: { status, matched_amount: matchedAmount, unmatched_amount: unmatchedAmount }
    });
  }

  async matchStatementLine(lineId: number, journalLineId: number) {
    return this.prisma.bankStatementLine.update({
      where: { id: lineId },
      data: { is_reconciled: true, matched_journal_line_id: journalLineId }
    });
  }

  async getUnmatchedLines(statementId: number) {
    return this.prisma.bankStatementLine.findMany({
      where: { statement_id: statementId, is_reconciled: false }
    });
  }

  async getJournalLinesForMatching(storeId: number, accountId: number, startDate: Date, endDate: Date) {
    // Ideally we filter by account and date to find unreconciled GL lines
    return this.prisma.journalEntryLine.findMany({
      where: {
        account_id: accountId,
        journal_entry: { store_id: storeId, posting_date: { gte: startDate, lte: endDate } }
      },
      include: { journal_entry: true }
    });
  }

  async createAdjustment(data: any) {
    return this.prisma.bankReconciliationAdjustment.create({ data });
  }

  async getReconciliation(id: number) {
    return this.prisma.bankReconciliation.findUnique({
      where: { id },
      include: { statement: { include: { lines: true } }, adjustments: true }
    });
  }
}
