import { Controller, Get, Query, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { ComparativeReportingService } from '../services/comparative-reporting.service';
import { ComparativeFilter } from '../interfaces/comparative-report.interface';

@RequirePermissions('finance.accounting.manage')
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
