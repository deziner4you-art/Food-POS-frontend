const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // DTOs
  'dto/ledger-query.dto.ts': `import { IsOptional, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class LedgerQueryDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  account_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fiscal_year_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  accounting_period_id?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  journal_id?: number;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
`,
  'dto/ledger-balance.dto.ts': `export class LedgerBalanceDto {
  account_id: number;
  opening_balance: number;
  debit_total: number;
  credit_total: number;
  closing_balance: number;
}
`,

  // Repository
  'repositories/general-ledger.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GeneralLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(storeId: number, data: any[]) {
    // We do one by one to easily maintain running balance per account,
    // Or normally we'd compute running balance and then use createMany.
    // Assuming calculation happens in service before calling this.
    return this.prisma.generalLedger.createMany({
      data: data.map(d => ({ ...d, store_id: storeId })),
    });
  }

  async findByQuery(storeId: number, query: any) {
    const where: Prisma.GeneralLedgerWhereInput = { store_id: storeId };
    
    if (query.account_id) where.account_id = query.account_id;
    if (query.fiscal_year_id) where.fiscal_year_id = query.fiscal_year_id;
    if (query.accounting_period_id) where.accounting_period_id = query.accounting_period_id;
    if (query.reference) where.reference = query.reference;
    if (query.start_date || query.end_date) {
      where.posting_date = {};
      if (query.start_date) where.posting_date.gte = new Date(query.start_date);
      if (query.end_date) where.posting_date.lte = new Date(query.end_date);
    }
    // Cannot easily query journal_id directly unless we join, 
    // but we have journal_entry relation so we can filter by it
    if (query.journal_id) {
      where.journal_entry = { journal_id: query.journal_id };
    }

    return this.prisma.generalLedger.findMany({
      where,
      orderBy: [
        { posting_date: 'asc' },
        { created_at: 'asc' },
      ],
      include: {
        account: true,
        journal_entry: true,
      },
    });
  }

  async getLatestEntryForAccount(storeId: number, accountId: number) {
    return this.prisma.generalLedger.findFirst({
      where: { store_id: storeId, account_id: accountId },
      orderBy: [
        { posting_date: 'desc' },
        { created_at: 'desc' },
      ],
    });
  }
}
`,

  // Service
  'services/general-ledger.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { GeneralLedgerRepository } from '../repositories/general-ledger.repository';
import { LedgerQueryDto } from '../dto/ledger-query.dto';

@Injectable()
export class GeneralLedgerService {
  constructor(private readonly repo: GeneralLedgerRepository) {}

  // Normally called by the Posting Engine (Internal Event)
  async postLedgerEntries(storeId: number, entries: any[]) {
    // Ensure no duplicate journal_entry_line_id
    // This is handled by DB unique constraint on journal_entry_line_id
    
    // Sort chronologically
    entries.sort((a, b) => new Date(a.posting_date).getTime() - new Date(b.posting_date).getTime());

    const recordsToInsert = [];
    
    // Process running balance
    // Note: In highly concurrent systems, this requires row locking on the Account.
    // For MVP we do it sequentially.
    for (const entry of entries) {
      const latest = await this.repo.getLatestEntryForAccount(storeId, entry.account_id);
      
      let currentBalance = latest ? Number(latest.running_balance) : 0;
      const debit = Number(entry.debit) || 0;
      const credit = Number(entry.credit) || 0;

      // Assuming standard mathematical balance: Balance + Debit - Credit 
      // (Depends on account type normal balance, but usually strict mathematical is easier 
      // and normal balance rules are applied on UI)
      currentBalance = currentBalance + debit - credit;

      recordsToInsert.push({
        ...entry,
        running_balance: currentBalance,
      });
    }

    try {
      await this.repo.createMany(storeId, recordsToInsert);
    } catch (e) {
      if (e.code === 'P2002') {
        throw new BadRequestException('Duplicate ledger posting rejected.');
      }
      throw e;
    }
  }

  async queryLedger(storeId: number, query: LedgerQueryDto) {
    return this.repo.findByQuery(storeId, query);
  }

  async getAccountBalance(storeId: number, accountId: number) {
    const latest = await this.repo.getLatestEntryForAccount(storeId, accountId);
    
    return {
      account_id: accountId,
      closing_balance: latest ? Number(latest.running_balance) : 0,
      as_of: latest ? latest.posting_date : null,
    };
  }

  async getTrialBalanceData(storeId: number, query: LedgerQueryDto) {
    // This aggregates debit and credit. For MVP, we fetch ledger and aggregate.
    const ledger = await this.repo.findByQuery(storeId, query);
    
    const balanceMap = new Map();
    for (const entry of ledger) {
      const id = entry.account_id;
      if (!balanceMap.has(id)) {
        balanceMap.set(id, { debit_total: 0, credit_total: 0, account: entry.account });
      }
      const data = balanceMap.get(id);
      data.debit_total += Number(entry.debit);
      data.credit_total += Number(entry.credit);
    }
    
    return Array.from(balanceMap.values());
  }
}
`,

  // Controller
  'controllers/general-ledger.controller.ts': `import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { GeneralLedgerService } from '../services/general-ledger.service';
import { LedgerQueryDto } from '../dto/ledger-query.dto';

@Controller('accounting/ledger')
export class GeneralLedgerController {
  constructor(private readonly service: GeneralLedgerService) {}

  @Get()
  async queryLedger(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Query() query: LedgerQueryDto,
  ) {
    return this.service.queryLedger(store_id, query);
  }

  @Get('account/:id/balance')
  async getAccountBalance(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getAccountBalance(store_id, id);
  }

  @Get('trial-balance')
  async getTrialBalanceData(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Query() query: LedgerQueryDto,
  ) {
    return this.service.getTrialBalanceData(store_id, query);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
