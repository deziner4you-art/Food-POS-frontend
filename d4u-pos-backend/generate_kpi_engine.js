const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/financial-kpi-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialKpiGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_KPI_GENERATED';
  occurred_at = new Date();
  entity_type = 'KPI_REPORT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/financial-kpi.interface.ts': `export interface KpiFilter {
  fiscal_year_id: number;
  accounting_period_id?: number;
  start_date: Date;
  end_date: Date;
  store_id: number;
}

export interface FinancialKpis {
  revenue: number;
  gross_profit: number;
  net_profit: number;
  ebit: number;
  ebitda: number;
  working_capital: number;
  current_assets: number;
  current_liabilities: number;
  average_inventory: number;
  accounts_receivable: number;
  accounts_payable: number;
  cash_position: number;
  operating_cash_flow: number;
}

export interface KpiResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  kpis: FinancialKpis;
  generated_date: Date;
}
`,

  'interfaces/financial-ratio.interface.ts': `export interface FinancialRatios {
  gross_margin_pct: number;
  net_margin_pct: number;
  operating_margin_pct: number;
  current_ratio: number;
  quick_ratio: number;
  inventory_turnover: number;
  return_on_assets_pct: number;
  return_on_equity_pct: number;
}

export interface RatioResult {
  store_id: number;
  start_date: Date;
  end_date: Date;
  ratios: FinancialRatios;
  generated_date: Date;
}
`,

  // Repository
  'repositories/financial-kpi.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FinancialKpiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  getPrisma() {
    return this.prisma;
  }
}
`,

  // Validator
  'validators/financial-kpi.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { KpiFilter } from '../interfaces/financial-kpi.interface';

@Injectable()
export class FinancialKpiValidator {
  validateFilter(filter: KpiFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }
    return filter;
  }
}
`,

  // Services
  'services/financial-kpi.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { ProfitLossService } from './profit-loss.service';
import { BalanceSheetService } from './balance-sheet.service';
import { CashFlowService } from './cash-flow.service';
import { FinancialKpiValidator } from '../validators/financial-kpi.validator';
import { KpiFilter, KpiResult, FinancialKpis } from '../interfaces/financial-kpi.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinancialKpiGeneratedEvent } from '../events/financial-kpi-generated.event';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class FinancialKpiService {
  constructor(
    private readonly plService: ProfitLossService,
    private readonly bsService: BalanceSheetService,
    private readonly cfService: CashFlowService,
    private readonly validator: FinancialKpiValidator,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateKpis(filter: KpiFilter, userId: number): Promise<KpiResult> {
    this.validator.validateFilter(filter);

    let plResult, bsResult, cfResult;
    try {
      plResult = await this.plService.generateProfitLoss(filter, userId);
      bsResult = await this.bsService.generateBalanceSheet({
        fiscal_year_id: filter.fiscal_year_id,
        date: filter.end_date,
        store_id: filter.store_id
      }, userId);
      cfResult = await this.cfService.generateCashFlow(filter, userId);
    } catch (e) {
      throw new BadRequestException(\`Underlying report generation failed: \${e.message}\`);
    }

    const findSection = (sections: StatementSectionResult[], type: string, namePart: string): StatementSectionResult | null => {
      for (const sec of sections) {
        if ((type && sec.type === type) || (namePart && sec.name.toLowerCase().includes(namePart.toLowerCase()))) {
          return sec;
        }
        const found = findSection(sec.sub_sections, type, namePart);
        if (found) return found;
      }
      return null;
    };

    const currentAssetsSec = findSection(bsResult.asset_sections, 'CURRENT_ASSETS', 'current asset');
    const currentLiabSec = findSection(bsResult.liability_sections, 'CURRENT_LIABILITIES', 'current liab');
    const inventorySec = findSection(bsResult.asset_sections, '', 'inventory');
    const arSec = findSection(bsResult.asset_sections, '', 'receivable');
    const apSec = findSection(bsResult.liability_sections, '', 'payable');

    const currentAssets = currentAssetsSec ? currentAssetsSec.total_amount : 0;
    const currentLiabilities = currentLiabSec ? currentLiabSec.total_amount : 0;
    const inventoryValue = inventorySec ? inventorySec.total_amount : 0;
    const accountsReceivable = arSec ? arSec.total_amount : 0;
    const accountsPayable = apSec ? apSec.total_amount : 0;

    const operatingIncome = findSection(plResult.sections, 'OPERATING_INCOME', 'operating income');
    const ebit = operatingIncome ? operatingIncome.total_amount : plResult.net_profit;

    const kpis: FinancialKpis = {
      revenue: plResult.total_revenue,
      gross_profit: plResult.gross_profit,
      net_profit: plResult.net_profit,
      ebit: ebit,
      ebitda: ebit, // Future ready to add Depreciation & Amortization
      working_capital: currentAssets - currentLiabilities,
      current_assets: currentAssets,
      current_liabilities: currentLiabilities,
      average_inventory: inventoryValue, // Approximation until historical averaging is strict
      accounts_receivable: accountsReceivable,
      accounts_payable: accountsPayable,
      cash_position: cfResult.closing_cash,
      operating_cash_flow: cfResult.net_operating_cash,
    };

    this.eventBus.publish(new FinancialKpiGeneratedEvent(filter.store_id, 0, userId, 'KPI', 'generate', { kpis }));

    return {
      store_id: filter.store_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      kpis,
      generated_date: new Date()
    };
  }

  // Raw underlying call for other services
  async getUnderlyingReports(filter: KpiFilter, userId: number) {
     return {
       plResult: await this.plService.generateProfitLoss(filter, userId),
       bsResult: await this.bsService.generateBalanceSheet({ fiscal_year_id: filter.fiscal_year_id, date: filter.end_date, store_id: filter.store_id }, userId),
       cfResult: await this.cfService.generateCashFlow(filter, userId)
     };
  }
}
`,

  'services/financial-ratio.service.ts': `import { Injectable } from '@nestjs/common';
import { FinancialKpiService } from './financial-kpi.service';
import { KpiFilter } from '../interfaces/financial-kpi.interface';
import { RatioResult, FinancialRatios } from '../interfaces/financial-ratio.interface';
import { StatementSectionResult } from '../interfaces/financial-statement.interface';

@Injectable()
export class FinancialRatioService {
  constructor(private readonly kpiService: FinancialKpiService) {}

  async generateRatios(filter: KpiFilter, userId: number): Promise<RatioResult> {
    const kpiData = await this.kpiService.generateKpis(filter, userId);
    const rawReports = await this.kpiService.getUnderlyingReports(filter, userId);
    
    const { kpis } = kpiData;
    const { plResult, bsResult } = rawReports;

    const cogsSec = plResult.sections.find((s: StatementSectionResult) => s.type === 'COST_OF_SALES' || s.name.toLowerCase().includes('cost of sales'));
    const cogs = cogsSec ? cogsSec.total_amount : 0;

    let totalAssets = 0;
    let totalEquity = 0;
    for (const sec of bsResult.asset_sections) totalAssets += sec.total_amount;
    for (const sec of bsResult.equity_sections) totalEquity += sec.total_amount;

    const grossMarginPct = kpis.revenue > 0 ? (kpis.gross_profit / kpis.revenue) * 100 : 0;
    const netMarginPct = kpis.revenue > 0 ? (kpis.net_profit / kpis.revenue) * 100 : 0;
    const operatingMarginPct = kpis.revenue > 0 ? (kpis.ebit / kpis.revenue) * 100 : 0;
    
    const currentRatio = kpis.current_liabilities > 0 ? (kpis.current_assets / kpis.current_liabilities) : 0;
    const quickRatio = kpis.current_liabilities > 0 ? ((kpis.current_assets - kpis.average_inventory) / kpis.current_liabilities) : 0;
    
    const inventoryTurnover = kpis.average_inventory > 0 ? (cogs / kpis.average_inventory) : 0;
    const roa = totalAssets > 0 ? (kpis.net_profit / totalAssets) * 100 : 0;
    const roe = totalEquity > 0 ? (kpis.net_profit / totalEquity) * 100 : 0;

    const ratios: FinancialRatios = {
      gross_margin_pct: Number(grossMarginPct.toFixed(2)),
      net_margin_pct: Number(netMarginPct.toFixed(2)),
      operating_margin_pct: Number(operatingMarginPct.toFixed(2)),
      current_ratio: Number(currentRatio.toFixed(2)),
      quick_ratio: Number(quickRatio.toFixed(2)),
      inventory_turnover: Number(inventoryTurnover.toFixed(2)),
      return_on_assets_pct: Number(roa.toFixed(2)),
      return_on_equity_pct: Number(roe.toFixed(2)),
    };

    return {
      store_id: filter.store_id,
      start_date: filter.start_date,
      end_date: filter.end_date,
      ratios,
      generated_date: new Date()
    };
  }
}
`,

  // Controllers
  'controllers/financial-kpi.controller.ts': `import { Controller, Get, Query, Req } from '@nestjs/common';
import { FinancialKpiService } from '../services/financial-kpi.service';
import { FinancialRatioService } from '../services/financial-ratio.service';
import { KpiFilter } from '../interfaces/financial-kpi.interface';

@Controller('accounting')
export class FinancialKpiController {
  constructor(
    private readonly kpiService: FinancialKpiService,
    private readonly ratioService: FinancialRatioService
  ) {}

  @Get('kpis')
  async getKpis(@Query() query: any, @Req() req: any) {
    const filter: KpiFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.kpiService.generateKpis(filter, userId);
  }

  @Get('financial-ratios')
  async getRatios(@Query() query: any, @Req() req: any) {
    const filter: KpiFilter = {
      fiscal_year_id: Number(query.fiscal_year_id),
      accounting_period_id: query.accounting_period_id ? Number(query.accounting_period_id) : undefined,
      start_date: new Date(query.start_date),
      end_date: new Date(query.end_date),
      store_id: Number(query.store_id),
    };
    const userId = req.user?.id || 1; 
    return this.ratioService.generateRatios(filter, userId);
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
