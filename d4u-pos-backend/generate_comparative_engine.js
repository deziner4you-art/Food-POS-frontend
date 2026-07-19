const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/comparative-report-generated.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class ComparativeReportGeneratedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'COMPARATIVE_REPORT_GENERATED';
  occurred_at = new Date();
  entity_type = 'REPORT_COMPARATIVE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/comparative-report.interface.ts': `export interface ComparativeFilter {
  report_type: 'TRIAL_BALANCE' | 'PROFIT_LOSS' | 'BALANCE_SHEET' | 'CASH_FLOW';
  store_id: number;
  base_fiscal_year_id: number;
  base_start_date: Date;
  base_end_date: Date;
  compare_fiscal_year_id: number;
  compare_start_date: Date;
  compare_end_date: Date;
}

export interface ComparativeLineResult {
  code?: string;
  name: string;
  base_amount: number;
  compare_amount: number;
  absolute_variance: number;
  percentage_variance: number;
}

export interface ComparativeSectionResult {
  name: string;
  type?: string;
  base_total: number;
  compare_total: number;
  absolute_variance: number;
  percentage_variance: number;
  lines: ComparativeLineResult[];
  sub_sections: ComparativeSectionResult[];
}

export interface ComparativeReportResult {
  report_type: string;
  store_id: number;
  base_period: { start: Date; end: Date };
  compare_period: { start: Date; end: Date };
  sections: ComparativeSectionResult[];
  generated_date: Date;
}
`,

  // Services
  'services/comparative-reporting.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { ProfitLossService } from './profit-loss.service';
import { BalanceSheetService } from './balance-sheet.service';
import { CashFlowService } from './cash-flow.service';
import { TrialBalanceService } from './trial-balance.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { ComparativeFilter, ComparativeReportResult, ComparativeSectionResult, ComparativeLineResult } from '../interfaces/comparative-report.interface';
import { ComparativeReportGeneratedEvent } from '../events/comparative-report-generated.event';

@Injectable()
export class ComparativeReportingService {
  constructor(
    private readonly plService: ProfitLossService,
    private readonly bsService: BalanceSheetService,
    private readonly cfService: CashFlowService,
    private readonly tbService: TrialBalanceService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async generateComparativeReport(filter: ComparativeFilter, userId: number): Promise<ComparativeReportResult> {
    
    let baseResult: any;
    let compareResult: any;

    try {
      if (filter.report_type === 'PROFIT_LOSS') {
         baseResult = await this.plService.generateProfitLoss({ ...filter, start_date: filter.base_start_date, end_date: filter.base_end_date, fiscal_year_id: filter.base_fiscal_year_id }, userId);
         compareResult = await this.plService.generateProfitLoss({ ...filter, start_date: filter.compare_start_date, end_date: filter.compare_end_date, fiscal_year_id: filter.compare_fiscal_year_id }, userId);
         
         baseResult = baseResult.sections;
         compareResult = compareResult.sections;

      } else if (filter.report_type === 'BALANCE_SHEET') {
         const br = await this.bsService.generateBalanceSheet({ store_id: filter.store_id, date: filter.base_end_date, fiscal_year_id: filter.base_fiscal_year_id }, userId);
         const cr = await this.bsService.generateBalanceSheet({ store_id: filter.store_id, date: filter.compare_end_date, fiscal_year_id: filter.compare_fiscal_year_id }, userId);
         
         // Standardize structure for comparison engine
         baseResult = [...br.asset_sections, ...br.liability_sections, ...br.equity_sections];
         compareResult = [...cr.asset_sections, ...cr.liability_sections, ...cr.equity_sections];

      } else if (filter.report_type === 'CASH_FLOW') {
         const br = await this.cfService.generateCashFlow({ ...filter, start_date: filter.base_start_date, end_date: filter.base_end_date, fiscal_year_id: filter.base_fiscal_year_id }, userId);
         const cr = await this.cfService.generateCashFlow({ ...filter, start_date: filter.compare_start_date, end_date: filter.compare_end_date, fiscal_year_id: filter.compare_fiscal_year_id }, userId);
         
         baseResult = [...br.operating_activities, ...br.investing_activities, ...br.financing_activities];
         compareResult = [...cr.operating_activities, ...cr.investing_activities, ...cr.financing_activities];

      } else if (filter.report_type === 'TRIAL_BALANCE') {
         const br = await this.tbService.generateTrialBalance({ ...filter, start_date: filter.base_start_date, end_date: filter.base_end_date, fiscal_year_id: filter.base_fiscal_year_id }, userId);
         const cr = await this.tbService.generateTrialBalance({ ...filter, start_date: filter.compare_start_date, end_date: filter.compare_end_date, fiscal_year_id: filter.compare_fiscal_year_id }, userId);
         
         // Map flat TB to pseudo-sections for the generic comparer
         const mapTbToSection = (tbLines: any[]) => {
           return [{
             name: 'Trial Balance',
             total_amount: tbLines.reduce((acc, l) => acc + Number(l.net_balance), 0),
             sub_sections: [],
             lines: tbLines.map(l => ({ name: l.account_name, code: l.account_code, amount: l.net_balance }))
           }];
         };

         baseResult = mapTbToSection(br.lines);
         compareResult = mapTbToSection(cr.lines);
      } else {
         throw new BadRequestException('Unsupported comparative report type');
      }
    } catch (e) {
      throw new BadRequestException(\`Failed to generate underlying reports for comparison. Details: \${e.message}\`);
    }

    const sections = this.compareSections(baseResult, compareResult);

    this.eventBus.publish(new ComparativeReportGeneratedEvent(
      filter.store_id, 0, userId, \`\${filter.report_type}-\${Date.now()}\`, 'compare', { filter }
    ));

    return {
      report_type: filter.report_type,
      store_id: filter.store_id,
      base_period: { start: filter.base_start_date, end: filter.base_end_date },
      compare_period: { start: filter.compare_start_date, end: filter.compare_end_date },
      sections,
      generated_date: new Date()
    };
  }

  private compareSections(baseSections: any[], compareSections: any[]): ComparativeSectionResult[] {
    const result: ComparativeSectionResult[] = [];
    
    // Create maps for faster lookup by name
    const compMap = new Map();
    for (const s of compareSections || []) {
      compMap.set(s.name, s);
    }

    const processedCompNames = new Set();

    for (const b of baseSections || []) {
      const c = compMap.get(b.name);
      
      const bTotal = Number(b.total_amount || 0);
      const cTotal = c ? Number(c.total_amount || 0) : 0;
      const absVar = bTotal - cTotal;
      const pctVar = cTotal !== 0 ? (absVar / Math.abs(cTotal)) * 100 : (bTotal !== 0 ? 100 : 0);

      result.push({
        name: b.name,
        type: b.type,
        base_total: bTotal,
        compare_total: cTotal,
        absolute_variance: absVar,
        percentage_variance: Number(pctVar.toFixed(2)),
        lines: this.compareLines(b.lines || [], c ? (c.lines || []) : []),
        sub_sections: this.compareSections(b.sub_sections || [], c ? (c.sub_sections || []) : [])
      });

      processedCompNames.add(b.name);
    }

    // Add sections that exist in compare but not in base
    for (const c of compareSections || []) {
      if (!processedCompNames.has(c.name)) {
        const cTotal = Number(c.total_amount || 0);
        result.push({
          name: c.name,
          type: c.type,
          base_total: 0,
          compare_total: cTotal,
          absolute_variance: -cTotal,
          percentage_variance: -100,
          lines: this.compareLines([], c.lines || []),
          sub_sections: this.compareSections([], c.sub_sections || [])
        });
      }
    }

    return result;
  }

  private compareLines(baseLines: any[], compareLines: any[]): ComparativeLineResult[] {
    const result: ComparativeLineResult[] = [];
    
    const compMap = new Map();
    for (const l of compareLines || []) {
      compMap.set(l.name, l);
    }

    const processedCompNames = new Set();

    for (const b of baseLines || []) {
      const c = compMap.get(b.name);
      
      const bAmt = Number(b.amount || 0);
      const cAmt = c ? Number(c.amount || 0) : 0;
      const absVar = bAmt - cAmt;
      const pctVar = cAmt !== 0 ? (absVar / Math.abs(cAmt)) * 100 : (bAmt !== 0 ? 100 : 0);

      result.push({
        name: b.name,
        code: b.code,
        base_amount: bAmt,
        compare_amount: cAmt,
        absolute_variance: absVar,
        percentage_variance: Number(pctVar.toFixed(2))
      });

      processedCompNames.add(b.name);
    }

    for (const c of compareLines || []) {
      if (!processedCompNames.has(c.name)) {
        const cAmt = Number(c.amount || 0);
        result.push({
          name: c.name,
          code: c.code,
          base_amount: 0,
          compare_amount: cAmt,
          absolute_variance: -cAmt,
          percentage_variance: -100
        });
      }
    }

    return result;
  }
}
`,

  // Controllers
  'controllers/comparative-reporting.controller.ts': `import { Controller, Get, Query, Req } from '@nestjs/common';
import { ComparativeReportingService } from '../services/comparative-reporting.service';
import { ComparativeFilter } from '../interfaces/comparative-report.interface';

@Controller('accounting/comparative')
export class ComparativeReportingController {
  constructor(private readonly compService: ComparativeReportingService) {}

  @Get()
  async getComparativeReport(@Query() query: any, @Req() req: any) {
    const filter: ComparativeFilter = {
      report_type: query.report_type,
      store_id: Number(query.store_id),
      base_fiscal_year_id: Number(query.base_fiscal_year_id),
      base_start_date: new Date(query.base_start_date),
      base_end_date: new Date(query.base_end_date),
      compare_fiscal_year_id: Number(query.compare_fiscal_year_id),
      compare_start_date: new Date(query.compare_start_date),
      compare_end_date: new Date(query.compare_end_date),
    };
    
    const userId = req.user?.id || 1; 
    return this.compService.generateComparativeReport(filter, userId);
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
