const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/budget-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BudgetCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BUDGET_CREATED';
  occurred_at = new Date();
  entity_type = 'BUDGET';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/budget-approved.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BudgetApprovedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BUDGET_APPROVED';
  occurred_at = new Date();
  entity_type = 'BUDGET';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/budget-comparison-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BudgetComparisonGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BUDGET_COMPARISON_GENERATED';
  occurred_at = new Date();
  entity_type = 'BUDGET_ANALYSIS';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/budget.interface.ts': `export interface BudgetLineInput {
  account_id?: number;
  account_group_id?: number;
  amount: number;
  notes?: string;
}

export interface CreateBudgetInput {
  store_id: number;
  fiscal_year_id: number;
  name: string;
  type: string; // ANNUAL, MONTHLY, DEPARTMENT
  lines: BudgetLineInput[];
}

export interface BudgetResult {
  id: number;
  store_id: number;
  name: string;
  type: string;
  status: string;
  version: number;
  total_amount: number;
}
`,

  'interfaces/budget-analysis.interface.ts': `export interface BudgetAnalysisFilter {
  store_id: number;
  fiscal_year_id: number;
  budget_id: number;
  start_date: Date;
  end_date: Date;
}

export interface BudgetAnalysisLine {
  account_code: string;
  account_name: string;
  budget_amount: number;
  actual_amount: number;
  variance: number;
  variance_pct: number;
  status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK';
}

export interface BudgetAnalysisResult {
  budget_id: number;
  store_id: number;
  fiscal_year_id: number;
  total_budget: number;
  total_actual: number;
  total_variance: number;
  total_variance_pct: number;
  lines: BudgetAnalysisLine[];
}
`,

  // Repository
  'repositories/budget.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBudget(data: any) {
    return this.prisma.budget.create({
      data: {
        store_id: data.store_id,
        fiscal_year_id: data.fiscal_year_id,
        name: data.name,
        type: data.type,
        status: 'DRAFT',
        created_by: data.user_id,
        versions: {
          create: [{
            version_number: 1,
            created_by: data.user_id,
            lines: {
              create: data.lines
            }
          }]
        }
      },
      include: {
        versions: { include: { lines: true } }
      }
    });
  }

  async approveBudget(budgetId: number, userId: number) {
    return this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: 'APPROVED',
        updated_by: userId
      }
    });
  }

  async getActiveBudget(budgetId: number) {
    return this.prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        versions: {
          where: { is_active: true },
          include: {
            lines: {
              include: {
                account: true,
                account_group: true
              }
            }
          }
        }
      }
    });
  }
}
`,

  // Validator
  'validators/budget.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateBudgetInput } from '../interfaces/budget.interface';

@Injectable()
export class BudgetValidator {
  validateCreation(data: CreateBudgetInput) {
    if (!data.name || data.name.trim() === '') {
      throw new BadRequestException('Budget name is required');
    }
    if (!['ANNUAL', 'MONTHLY', 'DEPARTMENT'].includes(data.type)) {
      throw new BadRequestException('Invalid budget type');
    }
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Budget lines are required');
    }
    
    for (const line of data.lines) {
      if (!line.account_id && !line.account_group_id) {
        throw new BadRequestException('Budget line must specify account_id or account_group_id');
      }
      if (line.amount < 0) {
        throw new BadRequestException('Budget amount cannot be negative');
      }
    }
  }
}
`,

  // Services
  'services/budget.service.ts': `import { Injectable } from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { BudgetValidator } from '../validators/budget.validator';
import { CreateBudgetInput, BudgetResult } from '../interfaces/budget.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BudgetCreatedEvent } from '../events/budget-created.event';
import { BudgetApprovedEvent } from '../events/budget-approved.event';

@Injectable()
export class BudgetService {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly validator: BudgetValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createBudget(input: CreateBudgetInput, userId: number): Promise<BudgetResult> {
    this.validator.validateCreation(input);

    const dataToSave = {
      ...input,
      user_id: userId,
      lines: input.lines.map(l => ({
        account_id: l.account_id,
        account_group_id: l.account_group_id,
        amount: l.amount,
        notes: l.notes
      }))
    };

    const result = await this.repository.createBudget(dataToSave);
    const activeVersion = result.versions[0];
    const totalAmount = activeVersion.lines.reduce((sum, line) => sum + Number(line.amount), 0);

    this.eventBus.publish(new BudgetCreatedEvent(
      result.store_id, 0, userId, result.id.toString(), 'budget_creation', { name: result.name }
    ));

    return {
      id: result.id,
      store_id: result.store_id,
      name: result.name,
      type: result.type,
      status: result.status,
      version: activeVersion.version_number,
      total_amount: totalAmount
    };
  }

  async approveBudget(budgetId: number, userId: number): Promise<any> {
    const budget = await this.repository.approveBudget(budgetId, userId);
    
    this.eventBus.publish(new BudgetApprovedEvent(
      budget.store_id, 0, userId, budget.id.toString(), 'budget_approval', {}
    ));

    return { success: true, status: budget.status };
  }
}
`,

  'services/budget-analysis.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { TrialBalanceService } from './trial-balance.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BudgetAnalysisFilter, BudgetAnalysisResult, BudgetAnalysisLine } from '../interfaces/budget-analysis.interface';
import { BudgetComparisonGeneratedEvent } from '../events/budget-comparison-generated.event';

@Injectable()
export class BudgetAnalysisService {
  constructor(
    private readonly budgetRepo: BudgetRepository,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async generateComparison(filter: BudgetAnalysisFilter, userId: number): Promise<BudgetAnalysisResult> {
    const budget = await this.budgetRepo.getActiveBudget(filter.budget_id);
    if (!budget) throw new BadRequestException('Budget not found');
    
    const activeVersion = budget.versions[0];
    if (!activeVersion) throw new BadRequestException('No active budget version found');

    const tbResult = await this.tbService.generateTrialBalance({
      store_id: filter.store_id,
      fiscal_year_id: filter.fiscal_year_id,
      start_date: filter.start_date,
      end_date: filter.end_date
    }, userId);

    const actualsMap = new Map<number, number>(); // account_id -> net_balance
    for (const tbLine of tbResult.lines) {
      actualsMap.set(tbLine.account_id, tbLine.net_balance);
    }

    let totalBudget = 0;
    let totalActual = 0;
    const lines: BudgetAnalysisLine[] = [];

    for (const bLine of activeVersion.lines) {
      const budgetAmount = Number(bLine.amount);
      const actualAmount = bLine.account_id ? (actualsMap.get(bLine.account_id) || 0) : 0; // Simple mapping logic

      // Revenue vs Expense logic for Favorable/Unfavorable
      // In this basic version, positive variance is under-budget (Favorable for expenses)
      const variance = budgetAmount - actualAmount;
      const variancePct = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
      
      let status: 'FAVORABLE' | 'UNFAVORABLE' | 'ON_TRACK' = 'ON_TRACK';
      if (variance > 0) status = 'FAVORABLE'; // Spent less than budget
      if (variance < 0) status = 'UNFAVORABLE'; // Spent more than budget
      
      lines.push({
        account_code: bLine.account?.code || bLine.account_group?.code || 'UNKNOWN',
        account_name: bLine.account?.name || bLine.account_group?.name || 'UNKNOWN',
        budget_amount: budgetAmount,
        actual_amount: actualAmount,
        variance,
        variance_pct: Number(variancePct.toFixed(2)),
        status
      });

      totalBudget += budgetAmount;
      totalActual += actualAmount;
    }

    const totalVariance = totalBudget - totalActual;
    const totalVariancePct = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;

    const result: BudgetAnalysisResult = {
      budget_id: budget.id,
      store_id: filter.store_id,
      fiscal_year_id: filter.fiscal_year_id,
      total_budget: totalBudget,
      total_actual: totalActual,
      total_variance: totalVariance,
      total_variance_pct: Number(totalVariancePct.toFixed(2)),
      lines
    };

    this.eventBus.publish(new BudgetComparisonGeneratedEvent(
      filter.store_id, 0, userId, filter.budget_id.toString(), 'budget_analysis', { variance: totalVariancePct }
    ));

    return result;
  }
}
`,

  // Controllers
  'controllers/budget.controller.ts': `import { Controller, Get, Post, Put, Body, Param, Query, Req } from '@nestjs/common';
import { BudgetService } from '../services/budget.service';
import { BudgetAnalysisService } from '../services/budget-analysis.service';
import { CreateBudgetInput } from '../interfaces/budget.interface';
import { BudgetAnalysisFilter } from '../interfaces/budget-analysis.interface';

@Controller('accounting/budget')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly analysisService: BudgetAnalysisService
  ) {}

  @Post()
  async createBudget(@Body() body: CreateBudgetInput, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.budgetService.createBudget(body, userId);
  }

  @Put(':id/approve')
  async approveBudget(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.budgetService.approveBudget(Number(id), userId);
  }

  @Get('vs-actual')
  async getBudgetVsActual(@Query() query: any, @Req() req: any) {
    const filter: BudgetAnalysisFilter = {
      store_id: Number(query.store_id),
      fiscal_year_id: Number(query.fiscal_year_id),
      budget_id: Number(query.budget_id),
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date)
    };
    const userId = req.user?.id || 1;
    return this.analysisService.generateComparison(filter, userId);
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
