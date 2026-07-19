const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/trial-balance-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class TrialBalanceGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'TRIAL_BALANCE_GENERATED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/trial-balance-filter.interface.ts': `export interface TrialBalanceFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
  warehouse_id?: number;
  cost_center_id?: number;
  account_type?: string;
  currency?: string;
}
`,

  'interfaces/trial-balance-result.interface.ts': `export interface TrialBalanceLine {
  account_id: number;
  account_code: string;
  account_name: string;
  account_type: string;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
  net_balance: number;
}

export interface TrialBalanceResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  lines: TrialBalanceLine[];
  total_opening_debit: number;
  total_opening_credit: number;
  total_period_debit: number;
  total_period_credit: number;
  total_closing_debit: number;
  total_closing_credit: number;
}
`,

  'interfaces/trial-balance.interface.ts': `// Combined exports
export * from './trial-balance-filter.interface';
export * from './trial-balance-result.interface';
`,

  // Repository
  'repositories/trial-balance.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class TrialBalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountBalances(storeId: number, startDate: Date, endDate: Date) {
    // We get all POSTED ledger entries grouped by account
    // For trial balance, we need opening (before startDate) and period (between start and end)
    
    // 1. Get all accounts for the store
    const accounts = await this.prisma.account.findMany({
      where: { store_id: storeId },
      orderBy: { code: 'asc' }
    });

    // 2. Get Opening Balances
    const openingEntries = await this.prisma.generalLedger.groupBy({
      by: ['account_id'],
      where: {
        store_id: storeId,
        status: 'POSTED',
        posting_date: { lt: startDate }
      },
      _sum: {
        debit_amount: true,
        credit_amount: true
      }
    });

    // 3. Get Period Activity
    const periodEntries = await this.prisma.generalLedger.groupBy({
      by: ['account_id'],
      where: {
        store_id: storeId,
        status: 'POSTED',
        posting_date: { gte: startDate, lte: endDate }
      },
      _sum: {
        debit_amount: true,
        credit_amount: true
      }
    });

    return { accounts, openingEntries, periodEntries };
  }
}
`,

  // Validator
  'validators/trial-balance.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { TrialBalanceFilter } from '../interfaces/trial-balance-filter.interface';

@Injectable()
export class TrialBalanceValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateFilters(filter: TrialBalanceFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const fiscalYear = await this.prisma.fiscalYear.findUnique({ where: { id: filter.fiscal_year_id } });
    if (!fiscalYear) throw new BadRequestException('Fiscal year not found.');

    if (filter.accounting_period_id) {
      const period = await this.prisma.accountingPeriod.findUnique({ where: { id: filter.accounting_period_id } });
      if (!period) throw new BadRequestException('Accounting period not found.');
    }

    return filter;
  }
}
`,

  // Services
  'services/trial-balance.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { TrialBalanceRepository } from '../repositories/trial-balance.repository';
import { TrialBalanceValidator } from '../validators/trial-balance.validator';
import { TrialBalanceFilter } from '../interfaces/trial-balance-filter.interface';
import { TrialBalanceResult, TrialBalanceLine } from '../interfaces/trial-balance-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { TrialBalanceGeneratedEvent } from '../events/trial-balance-generated.event';

@Injectable()
export class TrialBalanceService {
  private readonly logger = new Logger(TrialBalanceService.name);

  constructor(
    private readonly repository: TrialBalanceRepository,
    private readonly validator: TrialBalanceValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateTrialBalance(filter: TrialBalanceFilter, userId: number): Promise<TrialBalanceResult> {
    await this.validator.validateFilters(filter);

    const data = await this.repository.getAccountBalances(filter.store_id, filter.start_date, filter.end_date);
    
    const lines: TrialBalanceLine[] = [];
    let totOpDr = 0, totOpCr = 0, totPerDr = 0, totPerCr = 0, totClDr = 0, totClCr = 0;

    for (const account of data.accounts) {
      const op = data.openingEntries.find(o => o.account_id === account.id);
      const per = data.periodEntries.find(p => p.account_id === account.id);

      const opDr = op?._sum?.debit_amount ? Number(op._sum.debit_amount) : 0;
      const opCr = op?._sum?.credit_amount ? Number(op._sum.credit_amount) : 0;
      
      const perDr = per?._sum?.debit_amount ? Number(per._sum.debit_amount) : 0;
      const perCr = per?._sum?.credit_amount ? Number(per._sum.credit_amount) : 0;

      const clDr = opDr + perDr;
      const clCr = opCr + perCr;

      let netBalance = 0;
      // Depending on normal balance
      if (['ASSET', 'EXPENSE'].includes(account.account_type)) {
        netBalance = clDr - clCr;
      } else {
        netBalance = clCr - clDr;
      }

      // Only include accounts with activity or balances
      if (clDr > 0 || clCr > 0) {
        lines.push({
          account_id: account.id,
          account_code: account.code,
          account_name: account.name,
          account_type: account.account_type,
          opening_debit: opDr,
          opening_credit: opCr,
          period_debit: perDr,
          period_credit: perCr,
          closing_debit: clDr,
          closing_credit: clCr,
          net_balance: netBalance,
        });

        totOpDr += opDr;
        totOpCr += opCr;
        totPerDr += perDr;
        totPerCr += perCr;
        totClDr += clDr;
        totClCr += clCr;
      }
    }

    const result: TrialBalanceResult = {
      store_id: filter.store_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      lines,
      total_opening_debit: totOpDr,
      total_opening_credit: totOpCr,
      total_period_debit: totPerDr,
      total_period_credit: totPerCr,
      total_closing_debit: totClDr,
      total_closing_credit: totClCr,
    };

    this.eventBus.publish(new TrialBalanceGeneratedEvent(filter.store_id, 0, userId, 'TRIAL_BALANCE', 'generateTrialBalance', { start_date: filter.start_date, end_date: filter.end_date }));

    return result;
  }
}
`,

  // Controllers
  'controllers/trial-balance.controller.ts': `import { Controller, Get, Query, Req } from '@nestjs/common';
import { TrialBalanceService } from '../services/trial-balance.service';
import { TrialBalanceFilter } from '../interfaces/trial-balance-filter.interface';

@Controller('accounting/trial-balance')
export class TrialBalanceController {
  constructor(private readonly trialBalanceService: TrialBalanceService) {}

  @Get()
  async getTrialBalance(@Query() query: any, @Req() req: any) {
    const filter: TrialBalanceFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; // Fallback for simulation
    return this.trialBalanceService.generateTrialBalance(filter, userId);
  }

  @Get('export')
  async exportTrialBalance(@Query() query: any, @Req() req: any) {
    const filter: TrialBalanceFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1;
    const result = await this.trialBalanceService.generateTrialBalance(filter, userId);
    
    // Very basic CSV generation for demonstration
    let csv = 'Account Code,Account Name,Opening Debit,Opening Credit,Period Debit,Period Credit,Closing Debit,Closing Credit,Net Balance\\n';
    for (const line of result.lines) {
      csv += \`\${line.account_code},\${line.account_name},\${line.opening_debit},\${line.opening_credit},\${line.period_debit},\${line.period_credit},\${line.closing_debit},\${line.closing_credit},\${line.net_balance}\\n\`;
    }

    return { type: 'csv', data: csv };
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
