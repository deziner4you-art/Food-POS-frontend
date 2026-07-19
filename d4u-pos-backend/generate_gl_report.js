const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/general-ledger-report-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class GeneralLedgerReportGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'GENERAL_LEDGER_REPORT_GENERATED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/general-ledger-drilldown-viewed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class GeneralLedgerDrillDownViewedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'GENERAL_LEDGER_DRILLDOWN_VIEWED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/general-ledger-filter.interface.ts': `export interface GeneralLedgerFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  account_id?: number;
  account_group_id?: number;
  store_id: number;
  warehouse_id?: number;
  reference_module?: string;
  reference_number?: string;
  journal_number?: string;
  voucher_number?: string;
  user_id?: number;
}
`,

  'interfaces/general-ledger-line.interface.ts': `export interface GeneralLedgerLineResult {
  posting_date: Date;
  account_code: string;
  account_name: string;
  journal_number: string;
  voucher_number: string;
  reference_module: string;
  reference_number: string;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
  posted_by: string;
  created_at: Date;
}
`,

  'interfaces/general-ledger-result.interface.ts': `import { GeneralLedgerLineResult } from './general-ledger-line.interface';

export interface GeneralLedgerResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  account_id?: number;
  opening_balance: number;
  lines: GeneralLedgerLineResult[];
  closing_balance: number;
  total_debit: number;
  total_credit: number;
}
`,

  // Interface Index export file will be generated via AST replacement

  // Repository
  'repositories/general-ledger-report.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class GeneralLedgerReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOpeningBalance(storeId: number, accountId: number, startDate: Date) {
    const result = await this.prisma.generalLedger.aggregate({
      where: {
        store_id: storeId,
        account_id: accountId,
        posting_date: { lt: startDate }
      },
      _sum: {
        debit: true,
        credit: true
      }
    });
    return result._sum;
  }

  async getLedgerLines(filter: any) {
    return this.prisma.generalLedger.findMany({
      where: filter,
      include: {
        account: true,
        journal_entry: {
          include: {
            vouchers: {
              include: { voucher_type: true }
            },
            business_event: true,
            created_by_user: true
          }
        },
        journal_entry_line: true
      },
      orderBy: { posting_date: 'asc' }
    });
  }

  async getTransactionDrilldown(glLineId: number) {
    return this.prisma.generalLedger.findUnique({
      where: { id: glLineId },
      include: {
        journal_entry: {
          include: {
            lines: true,
            vouchers: { include: { voucher_type: true } },
            business_event: true,
          }
        }
      }
    });
  }
}
`,

  // Validator
  'validators/general-ledger.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { GeneralLedgerFilter } from '../interfaces/general-ledger-filter.interface';

@Injectable()
export class GeneralLedgerValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateFilters(filter: GeneralLedgerFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    if (filter.account_id) {
      const account = await this.prisma.account.findUnique({ where: { id: filter.account_id } });
      if (!account) throw new BadRequestException('Account not found.');
    }

    return filter;
  }
}
`,

  // Services
  'services/general-ledger-report.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { GeneralLedgerReportRepository } from '../repositories/general-ledger-report.repository';
import { GeneralLedgerValidator } from '../validators/general-ledger.validator';
import { GeneralLedgerFilter } from '../interfaces/general-ledger-filter.interface';
import { GeneralLedgerResult } from '../interfaces/general-ledger-result.interface';
import { GeneralLedgerLineResult } from '../interfaces/general-ledger-line.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { GeneralLedgerReportGeneratedEvent } from '../events/general-ledger-report-generated.event';

@Injectable()
export class GeneralLedgerReportService {
  private readonly logger = new Logger(GeneralLedgerReportService.name);

  constructor(
    private readonly repository: GeneralLedgerReportRepository,
    private readonly validator: GeneralLedgerValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateReport(filter: GeneralLedgerFilter, userId: number): Promise<GeneralLedgerResult> {
    await this.validator.validateFilters(filter);

    const prismaFilter: any = {
      store_id: filter.store_id,
      posting_date: { gte: filter.start_date, lte: filter.end_date }
    };

    if (filter.account_id) prismaFilter.account_id = filter.account_id;
    if (filter.journal_number) prismaFilter.journal_entry = { journal_number: filter.journal_number };

    // Fetch opening balance if single account is filtered
    let openingBalance = 0;
    if (filter.account_id) {
      const ob = await this.repository.getOpeningBalance(filter.store_id, filter.account_id, filter.start_date);
      // Determine net balance based on root_type logic later, simplified here to Dr - Cr for ASSET/EXPENSE, otherwise Cr - Dr
      // Note: GeneralLedger report often presents running balance raw or based on account normal balance.
      const opDr = ob?.debit ? Number(ob.debit) : 0;
      const opCr = ob?.credit ? Number(ob.credit) : 0;
      // We will keep a raw signed running balance for simplicity, or we compute based on account type
      openingBalance = opDr - opCr; // Simple debit positive, credit negative approach
    }

    const glEntries = await this.repository.getLedgerLines(prismaFilter);

    const lines: GeneralLedgerLineResult[] = [];
    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of glEntries) {
      const debit = Number(entry.debit);
      const credit = Number(entry.credit);
      totalDebit += debit;
      totalCredit += credit;
      runningBalance += (debit - credit);

      const je = entry.journal_entry;
      const voucher = je?.vouchers?.[0]; // Taking first voucher if exists
      const eventModule = je?.business_event?.source_module || 'MANUAL';

      lines.push({
        posting_date: entry.posting_date,
        account_code: entry.account?.code || '',
        account_name: entry.account?.name || '',
        journal_number: je?.journal_number || '',
        voucher_number: voucher?.voucher_number || '',
        reference_module: eventModule,
        reference_number: je?.reference_number || '',
        description: entry.journal_entry_line?.description || '',
        debit,
        credit,
        running_balance: runningBalance,
        posted_by: je?.created_by_user ? \`\${je.created_by_user.first_name} \${je.created_by_user.last_name}\` : 'System',
        created_at: entry.created_at
      });
    }

    const result: GeneralLedgerResult = {
      store_id: filter.store_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      account_id: filter.account_id,
      opening_balance: openingBalance,
      lines,
      closing_balance: runningBalance,
      total_debit: totalDebit,
      total_credit: totalCredit,
    };

    this.eventBus.publish(new GeneralLedgerReportGeneratedEvent(filter.store_id, 0, userId, 'GL_REPORT', 'generateReport', { filter }));

    return result;
  }
}
`,

  'services/general-ledger-drilldown.service.ts': `import { Injectable, NotFoundException } from '@nestjs/common';
import { GeneralLedgerReportRepository } from '../repositories/general-ledger-report.repository';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { GeneralLedgerDrillDownViewedEvent } from '../events/general-ledger-drilldown-viewed.event';

@Injectable()
export class GeneralLedgerDrilldownService {
  constructor(
    private readonly repository: GeneralLedgerReportRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async getDrilldown(glLineId: number, storeId: number, userId: number) {
    const glLine = await this.repository.getTransactionDrilldown(glLineId);
    
    if (!glLine) {
      throw new NotFoundException('General ledger line not found.');
    }

    if (glLine.store_id !== storeId) {
      throw new NotFoundException('General ledger line not found for this store.');
    }

    const je = glLine.journal_entry;
    const response = {
      gl_line: glLine,
      journal_entry: je,
      vouchers: je?.vouchers || [],
      business_event: je?.business_event || null,
      source_module: je?.business_event?.source_module || 'MANUAL',
      reference_number: je?.reference_number,
    };

    this.eventBus.publish(new GeneralLedgerDrillDownViewedEvent(storeId, 0, userId, glLineId.toString(), 'drilldown', { glLineId, source_module: response.source_module }));

    return response;
  }
}
`,

  // Controllers
  'controllers/general-ledger.controller.ts': `import { Controller, Get, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { GeneralLedgerReportService } from '../services/general-ledger-report.service';
import { GeneralLedgerDrilldownService } from '../services/general-ledger-drilldown.service';
import { GeneralLedgerFilter } from '../interfaces/general-ledger-filter.interface';

@Controller('accounting/general-ledger')
export class GeneralLedgerController {
  constructor(
    private readonly glReportService: GeneralLedgerReportService,
    private readonly glDrilldownService: GeneralLedgerDrilldownService
  ) {}

  @Get()
  async getGeneralLedger(@Query() query: any, @Req() req: any) {
    const filter: GeneralLedgerFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
      account_id: query.account_id ? Number(query.account_id) : undefined,
      journal_number: query.journal_number,
    };
    const userId = req.user?.id || 1; 
    return this.glReportService.generateReport(filter, userId);
  }

  @Get('export')
  async exportGeneralLedger(@Query() query: any, @Req() req: any) {
    const filter: GeneralLedgerFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
      account_id: query.account_id ? Number(query.account_id) : undefined,
    };
    const userId = req.user?.id || 1;
    const result = await this.glReportService.generateReport(filter, userId);
    
    let csv = 'Date,Account Code,Account Name,Journal Number,Voucher Number,Ref Module,Ref Number,Description,Debit,Credit,Running Balance,Posted By\\n';
    for (const line of result.lines) {
      csv += \`\${line.posting_date.toISOString()},\${line.account_code},\${line.account_name},\${line.journal_number},\${line.voucher_number},\${line.reference_module},\${line.reference_number},\${line.description.replace(/,/g, ' ')},\${line.debit},\${line.credit},\${line.running_balance},\${line.posted_by}\\n\`;
    }

    return { type: 'csv', data: csv };
  }

  @Get(':glLineId/drilldown')
  async drilldown(
    @Param('glLineId', ParseIntPipe) glLineId: number,
    @Query('store_id', ParseIntPipe) storeId: number,
    @Req() req: any
  ) {
    const userId = req.user?.id || 1;
    return this.glDrilldownService.getDrilldown(glLineId, storeId, userId);
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
