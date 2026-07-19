const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/balance-sheet-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BalanceSheetGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BALANCE_SHEET_GENERATED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/balance-sheet-filter.interface.ts': `export interface BalanceSheetFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  date: Date;
  store_id: number;
}
`,

  'interfaces/balance-sheet-result.interface.ts': `import { StatementSectionResult } from './financial-statement.interface';

export interface BalanceSheetResult {
  store_id: number;
  statement_id: number;
  statement_name: string;
  date: Date;
  
  asset_sections: StatementSectionResult[];
  total_assets: number;
  
  liability_sections: StatementSectionResult[];
  total_liabilities: number;
  
  equity_sections: StatementSectionResult[];
  total_equity_mapped: number;
  
  current_year_profit: number;
  total_equity: number;
  
  total_liabilities_and_equity: number;
  difference: number;
  
  generated_date: Date;
  generated_by: string;
}
`,

  'interfaces/balance-sheet.interface.ts': `export * from './balance-sheet-filter.interface';
export * from './balance-sheet-result.interface';
`,

  // Repository
  'repositories/balance-sheet.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BalanceSheetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getBalanceSheetStatementDef(storeId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, type: 'BALANCE_SHEET', is_active: true }
    });
  }

  async getFiscalYear(fiscalYearId: number) {
    return this.prisma.fiscalYear.findUnique({ where: { id: fiscalYearId } });
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
`,

  // Validator
  'validators/balance-sheet.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { BalanceSheetRepository } from '../repositories/balance-sheet.repository';
import { BalanceSheetFilter } from '../interfaces/balance-sheet-filter.interface';

@Injectable()
export class BalanceSheetValidator {
  constructor(private readonly repository: BalanceSheetRepository) {}

  async validateFilters(filter: BalanceSheetFilter) {
    const statement = await this.repository.getBalanceSheetStatementDef(filter.store_id);
    if (!statement) {
      throw new BadRequestException('Balance Sheet statement mapping not configured for this store.');
    }

    const fiscalYear = await this.repository.getFiscalYear(filter.fiscal_year_id);
    if (!fiscalYear) {
      throw new BadRequestException('Fiscal Year not found.');
    }

    return { filter, statement, fiscalYear };
  }
}
`,

  // Services
  'services/balance-sheet.service.ts': `import { Injectable } from '@nestjs/common';
import { BalanceSheetRepository } from '../repositories/balance-sheet.repository';
import { BalanceSheetValidator } from '../validators/balance-sheet.validator';
import { FinancialStatementBuilderService } from './financial-statement-builder.service';
import { ProfitLossService } from './profit-loss.service';
import { BalanceSheetFilter } from '../interfaces/balance-sheet-filter.interface';
import { BalanceSheetResult } from '../interfaces/balance-sheet-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BalanceSheetGeneratedEvent } from '../events/balance-sheet-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class BalanceSheetService {
  constructor(
    private readonly repository: BalanceSheetRepository,
    private readonly validator: BalanceSheetValidator,
    private readonly builderService: FinancialStatementBuilderService,
    private readonly plService: ProfitLossService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateBalanceSheet(filter: BalanceSheetFilter, userId: number): Promise<BalanceSheetResult> {
    const { statement, fiscalYear } = await this.validator.validateFilters(filter);

    // Trial balance needs start date of fiscal year to get accurate opening + period = closing for BS
    const fsResult = await this.builderService.buildStatement(
      filter.store_id,
      statement.id,
      fiscalYear.start_date,
      filter.date,
      filter.fiscal_year_id,
      userId
    );

    // Get current year profit from P&L
    const plResult = await this.plService.generateProfitLoss({
      store_id: filter.store_id,
      fiscal_year_id: filter.fiscal_year_id,
      accounting_period_id: filter.accounting_period_id,
      start_date: fiscalYear.start_date,
      end_date: filter.date
    }, userId);

    const user = await this.repository.getUser(userId);
    const generatedBy = user ? user.name : 'System';

    const result: BalanceSheetResult = {
      store_id: filter.store_id,
      statement_id: statement.id,
      statement_name: statement.name,
      date: filter.date,
      asset_sections: [],
      total_assets: 0,
      liability_sections: [],
      total_liabilities: 0,
      equity_sections: [],
      total_equity_mapped: 0,
      current_year_profit: plResult.net_profit,
      total_equity: 0,
      total_liabilities_and_equity: 0,
      difference: 0,
      generated_date: new Date(),
      generated_by: generatedBy
    };

    const processSections = (type: string, targetSections: StatementSectionResult[]) => {
      const sections = fsResult.sections.filter(s => s.type === type);
      let total = 0;
      for (const s of sections) {
        targetSections.push(s);
        total += s.total_amount;
      }
      return total;
    };

    result.total_assets = processSections('ASSETS', result.asset_sections);
    result.total_liabilities = processSections('LIABILITIES', result.liability_sections);
    result.total_equity_mapped = processSections('EQUITY', result.equity_sections);

    result.total_equity = result.total_equity_mapped + result.current_year_profit;
    result.total_liabilities_and_equity = result.total_liabilities + result.total_equity;
    
    // Assets = Liabilities + Equity. Difference should be 0.
    result.difference = result.total_assets - result.total_liabilities_and_equity;

    this.eventBus.publish(new BalanceSheetGeneratedEvent(filter.store_id, 0, userId, statement.id.toString(), 'generate', { filter }));

    return result;
  }
}
`,

  // Controllers
  'controllers/balance-sheet.controller.ts': `import { Controller, Get, Query, Req, ParseIntPipe } from '@nestjs/common';
import { BalanceSheetService } from '../services/balance-sheet.service';
import { BalanceSheetFilter } from '../interfaces/balance-sheet-filter.interface';

@Controller('accounting/balance-sheet')
export class BalanceSheetController {
  constructor(private readonly bsService: BalanceSheetService) {}

  @Get()
  async getBalanceSheet(@Query() query: any, @Req() req: any) {
    const filter: BalanceSheetFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      date: new Date(query.date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.bsService.generateBalanceSheet(filter, userId);
  }

  @Get('export')
  async exportBalanceSheet(@Query() query: any, @Req() req: any) {
    const filter: BalanceSheetFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      date: new Date(query.date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1;
    const result = await this.bsService.generateBalanceSheet(filter, userId);
    
    let csv = \`Balance Sheet Statement - \${result.statement_name}\\n\`;
    csv += \`As of: \${result.date.toISOString().split('T')[0]}\\n\\n\`;
    
    csv += 'Section,Amount\\n';
    
    const printSection = (sec: any, indent: string) => {
       csv += \`\${indent}\${sec.name},\${sec.total_amount}\\n\`;
       for (const sub of sec.sub_sections) {
         printSection(sub, indent + '  ');
       }
       for (const line of sec.lines) {
         csv += \`\${indent}  \${line.code} \${line.name},\${line.amount}\\n\`;
       }
    };

    csv += 'ASSETS\\n';
    result.asset_sections.forEach(s => printSection(s, '  '));
    csv += \`TOTAL ASSETS,\${result.total_assets}\\n\\n\`;

    csv += 'LIABILITIES\\n';
    result.liability_sections.forEach(s => printSection(s, '  '));
    csv += \`TOTAL LIABILITIES,\${result.total_liabilities}\\n\\n\`;

    csv += 'EQUITY\\n';
    result.equity_sections.forEach(s => printSection(s, '  '));
    csv += \`  Current Year Profit,\${result.current_year_profit}\\n\`;
    csv += \`TOTAL EQUITY,\${result.total_equity}\\n\\n\`;

    csv += \`TOTAL LIABILITIES + EQUITY,\${result.total_liabilities_and_equity}\\n\`;
    csv += \`DIFFERENCE,\${result.difference}\\n\\n\`;

    csv += \`Generated By: \${result.generated_by} on \${result.generated_date.toISOString()}\\n\`;

    return { type: 'csv', data: csv };
  }
}
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
