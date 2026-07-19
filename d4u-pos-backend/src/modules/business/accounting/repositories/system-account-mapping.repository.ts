import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { SystemAccountType } from '../enums/system-account-type.enum';

@Injectable()
export class SystemAccountMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, mappingType: SystemAccountType, accountId: number) {
    return this.prisma.systemAccountMapping.create({
      data: {
        store_id: storeId,
        mapping_type: mappingType,
        account_id: accountId,
      },
    });
  }

  async update(id: number, storeId: number, accountId: number) {
    return this.prisma.systemAccountMapping.updateMany({
      where: { id, store_id: storeId },
      data: { account_id: accountId },
    });
  }

  async findUnique(storeId: number, mappingType: SystemAccountType) {
    return this.prisma.systemAccountMapping.findUnique({
      where: {
        store_id_mapping_type: {
          store_id: storeId,
          mapping_type: mappingType,
        },
      },
      include: {
        account: true,
      },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.systemAccountMapping.findMany({
      where: { store_id: storeId },
      include: {
        account: true,
      },
    });
  }

  async checkAccountActiveAndBelongsToTenant(storeId: number, accountId: number) {
    return this.prisma.account.findFirst({
      where: {
        id: accountId,
        store_id: storeId,
        is_active: true,
      },
    });
  }
}
