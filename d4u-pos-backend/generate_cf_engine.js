const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/cash-flow-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class CashFlowGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'CASH_FLOW_GENERATED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/cash-flow-filter.interface.ts': `export interface CashFlowFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
}
`,

  'interfaces/cash-flow-result.interface.ts': `import { StatementSectionResult } from './financial-statement.interface';

export interface CashFlowResult {
  store_id: number;
  statement_id: number;
  statement_name: string;
  start_date: Date;
  end_date: Date;
  
  operating_activities: StatementSectionResult[];
  net_operating_cash: number;
  
  investing_activities: StatementSectionResult[];
  net_investing_cash: number;
  
  financing_activities: StatementSectionResult[];
  net_financing_cash: number;
  
  opening_cash: number;
  closing_cash: number;
  net_cash_movement: number;
  
  difference: number;
  
  generated_date: Date;
  generated_by: string;
}
`,

  'interfaces/cash-flow.interface.ts': `export * from './cash-flow-filter.interface';
export * from './cash-flow-result.interface';
`,

  // Repository
  'repositories/cash-flow.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class CashFlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCashFlowStatementDef(storeId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, type: 'CASH_FLOW', is_active: true }
    });
  }

  async getCashAccounts(storeId: number) {
    // Assuming 'CASH' or 'BANK' are identifiable. We'll fetch all and filter by type or name.
    // Or we just find accounts that are assets and have 'cash' or 'bank' in name.
    return this.prisma.account.findMany({
      where: {
        store_id: storeId,
        OR: [
          { name: { contains: 'Cash' } },
          { name: { contains: 'Bank' } },
        ]
      }
    });
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  getPrisma() {
    return this.prisma;
  }
}
`,

  // Validator
  'validators/cash-flow.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { CashFlowRepository } from '../repositories/cash-flow.repository';
import { CashFlowFilter } from '../interfaces/cash-flow-filter.interface';

@Injectable()
export class CashFlowValidator {
  constructor(private readonly repository: CashFlowRepository) {}

  async validateFilters(filter: CashFlowFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const statement = await this.repository.getCashFlowStatementDef(filter.store_id);
    if (!statement) {
      throw new BadRequestException('Cash Flow statement mapping not configured for this store.');
    }

    const cashAccounts = await this.repository.getCashAccounts(filter.store_id);
    if (!cashAccounts || cashAccounts.length === 0) {
      // We don't block, but it's good to know.
    }

    return { filter, statement, cashAccounts };
  }
}
`,

  // Builder Service
  'services/cash-flow-builder.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { FinancialStatementRepository } from '../repositories/financial-statement.repository';
import { TrialBalanceService } from './trial-balance.service';
import { FinancialStatementResult, StatementSectionResult, StatementLineResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class CashFlowBuilderService {
  constructor(
    private readonly repository: FinancialStatementRepository,
    private readonly tbService: TrialBalanceService
  ) {}

  async buildStatement(storeId: number, statementId: number, startDate: Date, endDate: Date, fiscalYearId: number, userId: number): Promise<FinancialStatementResult> {
    const statement = await this.repository.getStatementStructure(statementId);
    if (!statement || statement.store_id !== storeId) {
      throw new BadRequestException('Cash Flow statement not found.');
    }

    const tb = await this.tbService.generateTrialBalance({
      fiscal_year_id: fiscalYearId,
      start_date: startDate,
      end_date: endDate,
      store_id: storeId
    }, userId);

    const result: FinancialStatementResult = {
      statement_id: statement.id,
      store_id: storeId,
      name: statement.name,
      type: statement.type,
      start_date: startDate,
      end_date: endDate,
      sections: []
    };

    const tbMap = new Map();
    for (const line of tb.lines) {
      tbMap.set(line.account_id, line);
    }

    const accounts = await this.repository.getStoreAccounts(storeId);
    const groups = await this.repository.getStoreAccountGroups(storeId);

    const accountToGroupMap = new Map();
    for (const acc of accounts) {
      accountToGroupMap.set(acc.id, acc.account_group_id);
    }
    const groupNameMap = new Map();
    for (const g of groups) {
      groupNameMap.set(g.id, g.name);
    }

    const tbGroupMap = new Map();
    for (const line of tb.lines) {
      const gId = accountToGroupMap.get(line.account_id);
      if (gId) {
        if (!tbGroupMap.has(gId)) tbGroupMap.set(gId, []);
        tbGroupMap.get(gId).push(line);
      }
    }

    const buildSection = (section: any): StatementSectionResult => {
      let total = 0;
      const lines: StatementLineResult[] = [];

      for (const map of section.mappings) {
        if (!map.is_active) continue;

        if (map.account_id) {
          const tbLine: any = tbMap.get(map.account_id);
          if (tbLine) {
            // For Cash Flow, we use the net period movement (period_debit - period_credit or similar)
            // Or we just use what TrialBalance provides. Usually cash flow mappings map to period movements.
            const amount = Number(tbLine.period_credit || 0) - Number(tbLine.period_debit || 0); // Placeholder logic for CF
            lines.push({ account_id: map.account_id, code: tbLine.account_code, name: tbLine.account_name, amount });
            total += amount;
          }
        } else if (map.account_group_id) {
          const tbLines = tbGroupMap.get(map.account_group_id) || [];
          let gTotal = 0;
          for (const tl of tbLines) {
             const tbLine: any = tl;
             gTotal += (Number(tbLine.period_credit || 0) - Number(tbLine.period_debit || 0));
          }
          if (tbLines.length > 0) {
             const groupName = groupNameMap.get(map.account_group_id) || \`Group \${map.account_group_id}\`;
             lines.push({ account_group_id: map.account_group_id, code: \`GRP-\${map.account_group_id}\`, name: groupName, amount: gTotal });
             total += gTotal;
          }
        }
      }

      const subSections: StatementSectionResult[] = [];
      const children = statement.sections.filter(s => s.parent_section_id === section.id);
      for (const child of children) {
        const sub = buildSection(child);
        subSections.push(sub);
        total += sub.total_amount;
      }

      return {
        section_id: section.id,
        name: section.name,
        type: section.type,
        sort_order: section.sort_order,
        total_amount: total,
        sub_sections: subSections,
        lines
      };
    };

    const rootSections = statement.sections.filter(s => !s.parent_section_id);
    for (const rs of rootSections) {
      result.sections.push(buildSection(rs));
    }

    return result;
  }
}
`,

  // Services
  'services/cash-flow.service.ts': `import { Injectable } from '@nestjs/common';
import { CashFlowRepository } from '../repositories/cash-flow.repository';
import { CashFlowValidator } from '../validators/cash-flow.validator';
import { CashFlowBuilderService } from './cash-flow-builder.service';
import { TrialBalanceService } from './trial-balance.service';
import { CashFlowFilter } from '../interfaces/cash-flow-filter.interface';
import { CashFlowResult } from '../interfaces/cash-flow-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { CashFlowGeneratedEvent } from '../events/cash-flow-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class CashFlowService {
  constructor(
    private readonly repository: CashFlowRepository,
    private readonly validator: CashFlowValidator,
    private readonly builderService: CashFlowBuilderService,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateCashFlow(filter: CashFlowFilter, userId: number): Promise<CashFlowResult> {
    const { statement, cashAccounts } = await this.validator.validateFilters(filter);

    const fsResult = await this.builderService.buildStatement(
      filter.store_id,
      statement.id,
      filter.start_date,
      filter.end_date,
      filter.fiscal_year_id,
      userId
    );

    // Get trial balance to calculate opening and closing cash
    const tb = await this.tbService.generateTrialBalance({
      fiscal_year_id: filter.fiscal_year_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      store_id: filter.store_id
    }, userId);

    const cashAccountIds = cashAccounts.map(c => c.id);
    
    let openingCash = 0;
    let closingCash = 0;

    for (const line of tb.lines) {
      if (cashAccountIds.includes(line.account_id)) {
        const tbLine: any = line;
        // Cash is an asset, so debit is positive.
        openingCash += (Number(tbLine.opening_debit || 0) - Number(tbLine.opening_credit || 0));
        closingCash += (Number(tbLine.closing_debit || 0) - Number(tbLine.closing_credit || 0));
      }
    }

    const user = await this.repository.getUser(userId);
    const generatedBy = user ? user.name : 'System';

    const result: CashFlowResult = {
      store_id: filter.store_id,
      statement_id: statement.id,
      statement_name: statement.name,
      start_date: filter.start_date,
      end_date: filter.end_date,
      operating_activities: [],
      net_operating_cash: 0,
      investing_activities: [],
      net_investing_cash: 0,
      financing_activities: [],
      net_financing_cash: 0,
      opening_cash: openingCash,
      closing_cash: closingCash,
      net_cash_movement: 0,
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

    result.net_operating_cash = processSections('OPERATING_ACTIVITIES', result.operating_activities);
    result.net_investing_cash = processSections('INVESTING_ACTIVITIES', result.investing_activities);
    result.net_financing_cash = processSections('FINANCING_ACTIVITIES', result.financing_activities);

    result.net_cash_movement = result.net_operating_cash + result.net_investing_cash + result.net_financing_cash;
    
    result.difference = (result.opening_cash + result.net_cash_movement) - result.closing_cash;

    this.eventBus.publish(new CashFlowGeneratedEvent(filter.store_id, 0, userId, statement.id.toString(), 'generate', { filter }));

    return result;
  }
}
`,

  // Controllers
  'controllers/cash-flow.controller.ts': `import { Controller, Get, Query, Req, ParseIntPipe } from '@nestjs/common';
import { CashFlowService } from '../services/cash-flow.service';
import { CashFlowFilter } from '../interfaces/cash-flow-filter.interface';

@Controller('accounting/cash-flow')
export class CashFlowController {
  constructor(private readonly cfService: CashFlowService) {}

  @Get()
  async getCashFlow(@Query() query: any, @Req() req: any) {
    const filter: CashFlowFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.cfService.generateCashFlow(filter, userId);
  }

  @Get('export')
  async exportCashFlow(@Query() query: any, @Req() req: any) {
    const filter: CashFlowFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1;
    const result = await this.cfService.generateCashFlow(filter, userId);
    
    let csv = \`Cash Flow Statement - \${result.statement_name}\\n\`;
    csv += \`Period: \${result.start_date.toISOString().split('T')[0]} to \${result.end_date.toISOString().split('T')[0]}\\n\\n\`;
    
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

    csv += 'OPERATING ACTIVITIES\\n';
    result.operating_activities.forEach(s => printSection(s, '  '));
    csv += \`Net Cash from Operating Activities,\${result.net_operating_cash}\\n\\n\`;

    csv += 'INVESTING ACTIVITIES\\n';
    result.investing_activities.forEach(s => printSection(s, '  '));
    csv += \`Net Cash from Investing Activities,\${result.net_investing_cash}\\n\\n\`;

    csv += 'FINANCING ACTIVITIES\\n';
    result.financing_activities.forEach(s => printSection(s, '  '));
    csv += \`Net Cash from Financing Activities,\${result.net_financing_cash}\\n\\n\`;

    csv += \`OPENING CASH BALANCE,\${result.opening_cash}\\n\`;
    csv += \`NET CASH MOVEMENT,\${result.net_cash_movement}\\n\`;
    csv += \`CLOSING CASH BALANCE,\${result.closing_cash}\\n\\n\`;

    csv += \`DIFFERENCE (Verification),\${result.difference}\\n\\n\`;

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
