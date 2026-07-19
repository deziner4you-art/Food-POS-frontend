import { Injectable } from '@nestjs/common';
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

    const cogs = plResult.total_cost_of_sales || 0;

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
