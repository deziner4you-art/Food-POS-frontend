import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class TreasuryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBankAccount(id: number) {
    return this.prisma.bankAccount.findUnique({ where: { id } });
  }

  async getBankAccounts(storeId: number) {
    return this.prisma.bankAccount.findMany({ where: { store_id: storeId } });
  }

  async updateBankAccountBalance(id: number, newBalance: number) {
    return this.prisma.bankAccount.update({
      where: { id },
      data: { current_balance: newBalance }
    });
  }

  async createCashTransaction(data: any) {
    return this.prisma.cashTransaction.create({ data });
  }

  async createBankTransfer(data: any) {
    return this.prisma.bankTransfer.create({ data });
  }

  async upsertCashPosition(storeId: number, bankAccountId: number, data: any) {
    // Note: Prisma does not support unique constraint on non-unique fields natively without composite unique. 
    // We'll just create a new position snapshot instead of upserting.
    return this.prisma.cashPosition.create({
      data: {
        store_id: storeId,
        bank_account_id: bankAccountId,
        ...data
      }
    });
  }

  async createCashForecast(data: any) {
    return this.prisma.cashForecast.create({ data });
  }
}
