import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateAccountDto } from '../dto/create-account.dto';

@Injectable()
export class AccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: CreateAccountDto) {
    return this.prisma.account.create({
      data: {
        store_id: storeId,
        name: data.name,
        code: data.code,
        account_group_id: data.account_group_id,
        currency_id: data.currency_id,
        opening_balance: data.opening_balance || 0.0,
        is_active: data.is_active ?? true,
      },
    });
  }

  async findByCode(storeId: number, code: string) {
    return this.prisma.account.findUnique({
      where: { store_id_code: { store_id: storeId, code } },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.account.findFirst({
      where: { id, store_id: storeId },
      include: { journal_lines: true, system_mappings: true },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.account.findMany({
      where: { store_id: storeId },
      include: { account_group: true },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.account.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
