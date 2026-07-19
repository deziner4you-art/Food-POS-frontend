const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/profit-loss-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ProfitLossGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'PROFIT_LOSS_GENERATED';
  occurred_at = new Date();
  entity_type = 'REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/profit-loss-filter.interface.ts': `export interface ProfitLossFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
}
`,

  'interfaces/profit-loss-result.interface.ts': `import { StatementSectionResult } from './financial-statement.interface';

export interface ProfitLossResult {
  store_id: number;
  statement_id: number;
  statement_name: string;
  start_date: Date;
  end_date: Date;
  
  revenue_sections: StatementSectionResult[];
  total_revenue: number;
  
  cost_of_sales_sections: StatementSectionResult[];
  total_cost_of_sales: number;
  
  gross_profit: number;
  
  operating_expense_sections: StatementSectionResult[];
  total_operating_expenses: number;
  
  operating_income: number;
  
  other_income_sections: StatementSectionResult[];
  total_other_income: number;
  
  other_expense_sections: StatementSectionResult[];
  total_other_expenses: number;
  
  net_profit_before_tax: number;
  tax_expense: number;
  net_profit: number;
  
  generated_date: Date;
  generated_by: string;
}
`,

  'interfaces/profit-loss.interface.ts': `export * from './profit-loss-filter.interface';
export * from './profit-loss-result.interface';
`,

  // Repository
  'repositories/profit-loss.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ProfitLossRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfitLossStatementDef(storeId: number) {
    return this.prisma.financialStatement.findFirst({
      where: { store_id: storeId, type: 'PROFIT_LOSS', is_active: true }
    });
  }

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
`,

  // Validator
  'validators/profit-loss.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { ProfitLossRepository } from '../repositories/profit-loss.repository';
import { ProfitLossFilter } from '../interfaces/profit-loss-filter.interface';

@Injectable()
export class ProfitLossValidator {
  constructor(private readonly repository: ProfitLossRepository) {}

  async validateFilters(filter: ProfitLossFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const statement = await this.repository.getProfitLossStatementDef(filter.store_id);
    if (!statement) {
      throw new BadRequestException('Profit & Loss statement mapping not configured for this store.');
    }

    return { filter, statement };
  }
}
`,

  // Services
  'services/profit-loss.service.ts': `import { Injectable } from '@nestjs/common';
import { ProfitLossRepository } from '../repositories/profit-loss.repository';
import { ProfitLossValidator } from '../validators/profit-loss.validator';
import { FinancialStatementBuilderService } from './financial-statement-builder.service';
import { ProfitLossFilter } from '../interfaces/profit-loss-filter.interface';
import { ProfitLossResult } from '../interfaces/profit-loss-result.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ProfitLossGeneratedEvent } from '../events/profit-loss-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class ProfitLossService {
  constructor(
    private readonly repository: ProfitLossRepository,
    private readonly validator: ProfitLossValidator,
    private readonly builderService: FinancialStatementBuilderService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateProfitLoss(filter: ProfitLossFilter, userId: number): Promise<ProfitLossResult> {
    const { statement } = await this.validator.validateFilters(filter);

    // Build the underlying statement
    const fsResult = await this.builderService.buildStatement(
      filter.store_id,
      statement.id,
      filter.start_date,
      filter.end_date,
      filter.fiscal_year_id,
      userId
    );

    const user = await this.repository.getUser(userId);
    const generatedBy = user ? \`\${user.first_name} \${user.last_name}\` : 'System';

    const result: ProfitLossResult = {
      store_id: filter.store_id,
      statement_id: statement.id,
      statement_name: statement.name,
      start_date: filter.start_date,
      end_date: filter.end_date,
      revenue_sections: [],
      total_revenue: 0,
      cost_of_sales_sections: [],
      total_cost_of_sales: 0,
      gross_profit: 0,
      operating_expense_sections: [],
      total_operating_expenses: 0,
      operating_income: 0,
      other_income_sections: [],
      total_other_income: 0,
      other_expense_sections: [],
      total_other_expenses: 0,
      net_profit_before_tax: 0,
      tax_expense: 0, // Future ready
      net_profit: 0,
      generated_date: new Date(),
      generated_by: generatedBy
    };

    // Helper to get total of sections and push them
    const processSections = (type: string, targetSections: StatementSectionResult[]) => {
      const sections = fsResult.sections.filter(s => s.type === type);
      let total = 0;
      for (const s of sections) {
        targetSections.push(s);
        // Reverse signs for expenses based on standard if needed, or keep raw. We'll use absolute logic based on normal balances.
        // Assuming trial balance gives raw amounts, revenue credit is positive net balance, expense debit is positive net balance.
        // The TrialBalance engine returns absolute closing_balance. We sum them up.
        total += s.total_amount;
      }
      return total;
    };

    result.total_revenue = processSections('REVENUE', result.revenue_sections);
    result.total_cost_of_sales = processSections('COST_OF_SALES', result.cost_of_sales_sections);
    
    // Revenue is normally Credit, COGS is Debit. Net revenue - COGS.
    result.gross_profit = result.total_revenue - result.total_cost_of_sales;

    result.total_operating_expenses = processSections('OPERATING_EXPENSES', result.operating_expense_sections);
    result.operating_income = result.gross_profit - result.total_operating_expenses;

    result.total_other_income = processSections('OTHER_INCOME', result.other_income_sections);
    result.total_other_expenses = processSections('OTHER_EXPENSE', result.other_expense_sections);

    result.net_profit_before_tax = result.operating_income + result.total_other_income - result.total_other_expenses;
    result.net_profit = result.net_profit_before_tax - result.tax_expense;

    this.eventBus.publish(new ProfitLossGeneratedEvent(filter.store_id, 0, userId, statement.id.toString(), 'generate', { filter }));

    return result;
  }
}
`,

  // Controllers
  'controllers/profit-loss.controller.ts': `import { Controller, Get, Query, Req, ParseIntPipe } from '@nestjs/common';
import { ProfitLossService } from '../services/profit-loss.service';
import { ProfitLossFilter } from '../interfaces/profit-loss-filter.interface';

@Controller('accounting/profit-loss')
export class ProfitLossController {
  constructor(private readonly plService: ProfitLossService) {}

  @Get()
  async getProfitLoss(@Query() query: any, @Req() req: any) {
    const filter: ProfitLossFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.plService.generateProfitLoss(filter, userId);
  }

  @Get('export')
  async exportProfitLoss(@Query() query: any, @Req() req: any) {
    const filter: ProfitLossFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1;
    const result = await this.plService.generateProfitLoss(filter, userId);
    
    let csv = \`Profit & Loss Statement - \${result.statement_name}\\n\`;
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

    csv += 'REVENUE\\n';
    result.revenue_sections.forEach(s => printSection(s, '  '));
    csv += \`Total Revenue,\${result.total_revenue}\\n\\n\`;

    csv += 'COST OF SALES\\n';
    result.cost_of_sales_sections.forEach(s => printSection(s, '  '));
    csv += \`Total Cost of Sales,\${result.total_cost_of_sales}\\n\\n\`;

    csv += \`GROSS PROFIT,\${result.gross_profit}\\n\\n\`;

    csv += 'OPERATING EXPENSES\\n';
    result.operating_expense_sections.forEach(s => printSection(s, '  '));
    csv += \`Total Operating Expenses,\${result.total_operating_expenses}\\n\\n\`;

    csv += \`OPERATING INCOME,\${result.operating_income}\\n\\n\`;

    csv += 'OTHER INCOME\\n';
    result.other_income_sections.forEach(s => printSection(s, '  '));
    csv += \`Total Other Income,\${result.total_other_income}\\n\\n\`;

    csv += 'OTHER EXPENSES\\n';
    result.other_expense_sections.forEach(s => printSection(s, '  '));
    csv += \`Total Other Expenses,\${result.total_other_expenses}\\n\\n\`;

    csv += \`NET PROFIT BEFORE TAX,\${result.net_profit_before_tax}\\n\`;
    csv += \`TAX EXPENSE,\${result.tax_expense}\\n\`;
    csv += \`NET PROFIT,\${result.net_profit}\\n\\n\`;

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
