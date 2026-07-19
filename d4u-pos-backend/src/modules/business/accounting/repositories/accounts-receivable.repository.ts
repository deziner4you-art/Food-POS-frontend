import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class AccountsReceivableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReceivable(data: any) {
    return this.prisma.customerReceivable.create({ data });
  }

  async getReceivable(id: number) {
    return this.prisma.customerReceivable.findUnique({ where: { id } });
  }

  async getReceivablesByCustomer(storeId: number, customerId: number) {
    return this.prisma.customerReceivable.findMany({
      where: { store_id: storeId, customer_id: customerId }
    });
  }

  async updateReceivableBalance(id: number, paidAmount: number, outstandingBalance: number, status: string) {
    return this.prisma.customerReceivable.update({
      where: { id },
      data: {
        paid_amount: paidAmount,
        outstanding_balance: outstandingBalance,
        status
      }
    });
  }

  async createReceipt(data: any) {
    return this.prisma.customerReceipt.create({ data });
  }

  async getOpenReceivables(storeId: number, customerId: number) {
    return this.prisma.customerReceivable.findMany({
      where: {
        store_id: storeId,
        customer_id: customerId,
        status: { in: ['OPEN', 'PARTIAL'] }
      }
    });
  }

  async upsertAging(storeId: number, customerId: number, data: any) {
    return this.prisma.customerAging.upsert({
      where: { store_id_customer_id: { store_id: storeId, customer_id: customerId } },
      update: data,
      create: {
        store_id: storeId,
        customer_id: customerId,
        ...data
      }
    });
  }

  async getCreditLimit(storeId: number, customerId: number) {
    return this.prisma.customerCreditLimit.findUnique({
      where: { store_id_customer_id: { store_id: storeId, customer_id: customerId } }
    });
  }

  async getCustomer(id: number) {
    return this.prisma.customer.findUnique({ where: { id } });
  }
}
