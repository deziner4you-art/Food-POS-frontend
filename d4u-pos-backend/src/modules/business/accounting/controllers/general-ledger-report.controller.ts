import { Controller, Get, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { GeneralLedgerReportService } from '../services/general-ledger-report.service';
import { GeneralLedgerDrilldownService } from '../services/general-ledger-drilldown.service';
import { GeneralLedgerFilter } from '../interfaces/general-ledger-filter.interface';

@Controller('accounting/general-ledger-report')
export class GeneralLedgerReportController {
  constructor(
    private readonly glReportService: GeneralLedgerReportService,
    private readonly glDrilldownService: GeneralLedgerDrilldownService
  ) {}

  @RequirePermissions('finance.accounting.view')
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

  @RequirePermissions('finance.accounting.export')
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
      csv += `${line.posting_date.toISOString()},${line.account_code},${line.account_name},${line.journal_number},${line.voucher_number},${line.reference_module},${line.reference_number},${line.description.replace(/,/g, ' ')},${line.debit},${line.credit},${line.running_balance},${line.posted_by}\n`;
    }

    return { type: 'csv', data: csv };
  }

  @RequirePermissions('finance.accounting.view')
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
