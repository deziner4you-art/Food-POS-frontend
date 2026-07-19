import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateAccountGroupDto } from '../dto/create-account-group.dto';

@Injectable()
export class AccountGroupRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: CreateAccountGroupDto) {
    return this.prisma.accountGroup.create({
      data: {
        store_id: storeId,
        ...data,
      },
    });
  }

  async findByCode(storeId: number, code: string) {
    return this.prisma.accountGroup.findUnique({
      where: { store_id_code: { store_id: storeId, code } },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.accountGroup.findFirst({
      where: { id, store_id: storeId },
    });
  }

  async findChildren(storeId: number, parentId: number) {
    return this.prisma.accountGroup.findMany({
      where: { parent_group_id: parentId, store_id: storeId },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.accountGroup.findMany({
      where: { store_id: storeId },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.accountGroup.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
