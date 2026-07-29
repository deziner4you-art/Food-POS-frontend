import { Controller, Post, Get, Body, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FinancialStatementMappingService } from '../services/financial-statement-mapping.service';
import { FinancialStatementBuilderService } from '../services/financial-statement-builder.service';
import { CreateStatementSectionDto } from '../interfaces/statement-section.interface';
import { CreateStatementMappingDto } from '../interfaces/mapping.interface';
import { getSessionStoreId, getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/financial-statements')
export class FinancialStatementController {
  constructor(
    private readonly mappingService: FinancialStatementMappingService,
    private readonly builderService: FinancialStatementBuilderService
  ) {}

  @RequirePermissions('finance.accounting.create')
  @Post()
  async createStatement(@Body() body: any, @Req() req: any) {
    const storeId = body.store_id ?? getSessionStoreId(req.user);
    return this.mappingService.createStatement(storeId, body.name, body.type, body.description);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('sections')
  async createSection(@Body() dto: any, @Body('store_id') storeId: number, @Req() req: any) {
    return this.mappingService.createSection(storeId ?? getSessionStoreId(req.user), dto);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('mappings')
  async createMapping(@Body() dto: any, @Body('store_id') storeId: number, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.mappingService.mapAccount(storeId ?? getSessionStoreId(req.user), dto, userId);
  }

  @RequirePermissions('finance.accounting.view')
  @Get(':id/build')
  async buildStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('store_id', ParseIntPipe) storeId: number,
    @Query('fiscal_year_id', ParseIntPipe) fiscalYearId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any
  ) {
    const userId = getSessionUserId(req.user);
    return this.builderService.buildStatement(storeId, id, new Date(startDate), new Date(endDate), fiscalYearId, userId);
  }
}
