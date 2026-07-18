import { Controller, Get, Query, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // GET /reports/daily?store_id=1&date=2026-07-03
  @Get('daily')
  getDailyReport(
    @Query('store_id') store_id: string,
    @Query('date') date?: string,
  ) {
    return this.service.getDailyReport(Number(store_id), date);
  }

  // GET /reports/branch-analytics
  @Get('branch-analytics')
  getBranchAnalytics(
    @Query('store_id') store_id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('business_day_id') business_day_id?: string,
    @Query('cashier_id') cashier_id?: string,
  ) {
    return this.service.getBranchAnalytics(
      Number(store_id),
      start_date,
      end_date,
      business_day_id ? Number(business_day_id) : undefined,
      cashier_id ? Number(cashier_id) : undefined
    );
  }

  // GET /reports/shifts?store_id=1
  @Get('shifts')
  getShifts(@Query('store_id') store_id: string, @Query('limit') limit?: string) {
    return this.service.getShifts(Number(store_id), limit ? Number(limit) : 10);
  }

  // GET /reports/weekly?store_id=1
  @Get('weekly')
  getWeeklyTrend(@Query('store_id') store_id: string) {
    return this.service.getWeeklyTrend(Number(store_id));
  }

  // GET /reports/top-products?store_id=1&limit=10
  @Get('top-products')
  getTopProducts(
    @Query('store_id') store_id: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getTopProducts(Number(store_id), limit ? Number(limit) : 10);
  }

  // GET /reports/voids?store_id=1
  @Get('voids')
  getVoids(
    @Query('store_id') store_id: string,
    @Query('business_day_id') business_day_id?: string,
  ) {
    return this.service.getVoidedOrders(Number(store_id), business_day_id ? Number(business_day_id) : undefined);
  }

  // GET /reports/brand/:brand_id — Multi-store overview
  @Get('brand/:brand_id')
  getBrandOverview(@Param('brand_id') brand_id: string) {
    return this.service.getBrandOverview(Number(brand_id));
  }
}
