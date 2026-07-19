import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VoucherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: Omit<Prisma.VoucherUncheckedCreateInput, 'store_id'>) {
    return this.prisma.voucher.create({
      data: { ...data, store_id: storeId },
    });
  }

  async update(id: number, storeId: number, data: Prisma.VoucherUncheckedUpdateInput) {
    return this.prisma.voucher.update({
      where: { id, store_id: storeId },
      data,
    });
  }

  async findById(id: number, storeId: number) {
    return this.prisma.voucher.findFirst({
      where: { id, store_id: storeId },
      include: {
        fiscal_year: true,
        accounting_period: true,
        journal_entry: true,
      },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.voucher.findMany({
      where: { store_id: storeId },
      orderBy: { date: 'desc' },
    });
  }
}
