import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';

@Injectable()
export class FinancialStatementValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: FinancialStatementRepository
  ) {}

  async validateMapping(storeId: number, sectionId: number, accountId?: number, accountGroupId?: number) {
    if (!accountId && !accountGroupId) {
      throw new BadRequestException('Must provide either account_id or account_group_id');
    }

    const section = await this.repository.getSection(sectionId);
    if (!section) throw new BadRequestException('Section not found.');

    const statement = await this.repository.getStatementByStoreAndId(storeId, section.statement_id);
    if (!statement) throw new BadRequestException('Statement not found or belongs to another store.');

    if (accountId) {
      const account = await this.prisma.account.findFirst({ where: { id: accountId, store_id: storeId } });
      if (!account) throw new BadRequestException('Account not found in this store.');
    }

    if (accountGroupId) {
      const group = await this.prisma.accountGroup.findFirst({ where: { id: accountGroupId, store_id: storeId } });
      if (!group) throw new BadRequestException('Account group not found in this store.');
    }

    const duplicate = await this.repository.checkDuplicateMapping(section.statement_id, accountId, accountGroupId);
    if (duplicate) {
      throw new BadRequestException('Account or Group is already mapped in this statement.');
    }
  }
}
