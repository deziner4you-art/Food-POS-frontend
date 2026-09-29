import { Controller, Get, Query, Param, Req } from '@nestjs/common';
import { RequireModule, RequirePermissions } from '../../../common/decorators';
import { assertTenantBrandAccess, assertTenantStoreAccess } from '../../../common/utils/tenant.util';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ReportsService } from './reports.service';

@Controller('reports')
@RequireModule('ANALYTICS')
export class ReportsController {
  constructor(
    private readonly service: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  // GET /reports/daily?store_id=1&date=2026-07-03
  @RequirePermissions('finance.reports.view')
  @Get('daily')
  getDailyReport(
    @Query('store_id') store_id: string,
    @Query('date') date?: string,
    @Req() req?: any,
  ) {
    return assertTenantStoreAccess(this.prisma, req?.user, Number(store_id)).then(() =>
      this.service.getDailyReport(Number(store_id), date, req?.user),
    );
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
    return assertTenantStoreAccess(this.prisma, req?.user, Number(store_id)).then(() => this.service.getBranchAnalytics(
      Number(store_id),
      start_date,
      end_date,
      business_day_id ? Number(business_day_id) : undefined,
      cashier_id ? Number(cashier_id) : undefined,
      req?.user,
    ));
  }

  // GET /reports/shifts?store_id=1
  @RequirePermissions('finance.reports.view')
  @Get('shifts')
  getShifts(
    @Query('store_id') store_id: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return assertTenantStoreAccess(this.prisma, req?.user, Number(store_id)).then(() =>
      this.service.getShifts(Number(store_id), limit ? Number(limit) : 10, req?.user),
    );
  }

  // GET /reports/weekly?store_id=1
  @RequirePermissions('finance.reports.view')
  @Get('weekly')
  getWeeklyTrend(@Query('store_id') store_id: string, @Req() req?: any) {
    return assertTenantStoreAccess(this.prisma, req?.user, Number(store_id)).then(() =>
      this.service.getWeeklyTrend(Number(store_id), req?.user),
    );
  }

  // GET /reports/top-products?store_id=1&limit=10
  @RequirePermissions('finance.reports.view')
  @Get('top-products')
  getTopProducts(
    @Query('store_id') store_id: string,
    @Query('limit') limit?: string,
    @Req() req?: any,
  ) {
    return assertTenantStoreAccess(this.prisma, req?.user, Number(store_id)).then(() =>
      this.service.getTopProducts(Number(store_id), limit ? Number(limit) : 10, req?.user),
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
    return assertTenantStoreAccess(this.prisma, req?.user, Number(store_id)).then(() =>
      this.service.getVoidedOrders(
        Number(store_id),
        business_day_id ? Number(business_day_id) : undefined,
        req?.user,
      ),
    );
  }

  // GET /reports/brand/:brand_id — Multi-store overview
  @RequirePermissions('finance.reports.view')
  @Get('brand/:brand_id')
  getBrandOverview(@Param('brand_id') brand_id: string, @Req() req?: any) {
    return assertTenantBrandAccess(this.prisma, req?.user, Number(brand_id)).then(() =>
      this.service.getBrandOverview(Number(brand_id), req?.user),
    );
  }
}
