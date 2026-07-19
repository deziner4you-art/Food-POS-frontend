import { Injectable, BadRequestException } from '@nestjs/common';
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
      throw new BadRequestException(`Underlying report generation failed: ${e.message}`);
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

    const ebit = plResult.operating_income !== undefined ? plResult.operating_income : plResult.net_profit;

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
