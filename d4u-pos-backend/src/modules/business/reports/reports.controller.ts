import { Controller, Get, Query, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // GET /reports/daily?store_id=1&date=2026-07-03
  @RequirePermissions('finance.reports.view')
  @Get('daily')
  getDailyReport(
    @Query('store_id') store_id: string,
    @Query('date') date?: string,
    @Req() req?: any,
  ) {
    return this.service.getDailyReport(Number(store_id), date, req?.user);
  }

  // GET /reports/branch-analytics
  @RequirePermissions('finance.reports.view')
  @Get('branch-analytics')
  getBranchAnalytics(
    @Query('store_id') store_id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('business_day_id') business_day_id?: string,
    @Query('cashier_id') cashier_id?: string,
    @Req() req?: any,
  ) {
    return this.service.getBranchAnalytics(
      Number(store_id),
      start_date,
      end_date,
      business_day_id ? Number(business_day_id) : undefined,
      cashier_id ? Number(cashier_id) : undefined,
      req?.user,
    );
  }

  // GET /reports/shifts?store_id=1
  @RequirePermissions('finance.reports.view')
  @Get('shifts')
  getShifts(
    @Query('store_id') store_id: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return this.service.getShifts(Number(store_id), limit ? Number(limit) : 10, req?.user);
  }

  // GET /reports/weekly?store_id=1
  @RequirePermissions('finance.reports.view')
  @Get('weekly')
  getWeeklyTrend(@Query('store_id') store_id: string, @Req() req?: any) {
    return this.service.getWeeklyTrend(Number(store_id), req?.user);
  }

  // GET /reports/top-products?store_id=1&limit=10
  @RequirePermissions('finance.reports.view')
  @Get('top-products')
  getTopProducts(
    @Query('store_id') store_id: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return this.service.getTopProducts(
      Number(store_id),
      limit ? Number(limit) : 10,
      req?.user,
    );
  }

  // GET /reports/voids?store_id=1
  @RequirePermissions('finance.reports.view')
  @Get('voids')
  getVoids(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
    @Req() req?: any,
  ) {
    return this.service.getVoidedOrders(
      Number(store_id),
      business_day_id ? Number(business_day_id) : undefined,
      req?.user,
    );
  }

  // GET /reports/brand/:brand_id — Multi-store overview
  @RequirePermissions('finance.reports.view')
  @Get('brand/:brand_id')
  getBrandOverview(@Param('brand_id') brand_id: string, @Req() req?: any) {
    return this.service.getBrandOverview(Number(brand_id), req?.user);
  }
}
