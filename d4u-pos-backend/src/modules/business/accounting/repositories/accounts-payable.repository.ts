import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class AccountsPayableRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPayable(data: any) {
    return this.prisma.vendorPayable.create({ data });
  }

  async getPayable(id: number) {
    return this.prisma.vendorPayable.findUnique({ where: { id } });
  }

  async getPayablesByVendor(storeId: number, vendorId: number) {
    return this.prisma.vendorPayable.findMany({
      where: { store_id: storeId, vendor_id: vendorId }
    });
  }

  async updatePayableBalance(id: number, paidAmount: number, outstandingBalance: number, status: string) {
    return this.prisma.vendorPayable.update({
      where: { id },
      data: {
        paid_amount: paidAmount,
        outstanding_balance: outstandingBalance,
        status
      }
    });
  }

  async createPayment(data: any) {
    return this.prisma.vendorPayment.create({ data });
  }

  async getOpenPayables(storeId: number, vendorId: number) {
    return this.prisma.vendorPayable.findMany({
      where: {
        store_id: storeId,
        vendor_id: vendorId,
        status: { in: ['OPEN', 'PARTIAL'] }
      }
    });
  }

  async upsertAging(storeId: number, vendorId: number, data: any) {
    return this.prisma.vendorAging.upsert({
      where: { store_id_vendor_id: { store_id: storeId, vendor_id: vendorId } },
      update: data,
      create: {
        store_id: storeId,
        vendor_id: vendorId,
        ...data
      }
    });
  }

  async getVendor(id: number) {
    return this.prisma.vendor.findUnique({ where: { id } });
  }
}
