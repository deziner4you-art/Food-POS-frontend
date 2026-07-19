import { Controller, Post, Get, Body, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FinancialStatementMappingService } from '../services/financial-statement-mapping.service';
import { FinancialStatementBuilderService } from '../services/financial-statement-builder.service';
import { CreateStatementSectionDto } from '../interfaces/statement-section.interface';
import { CreateStatementMappingDto } from '../interfaces/mapping.interface';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/financial-statements')
export class FinancialStatementController {
  constructor(
    private readonly mappingService: FinancialStatementMappingService,
    private readonly builderService: FinancialStatementBuilderService
  ) {}

  @Post()
  async createStatement(@Body() body: any, @Req() req: any) {
    const storeId = body.store_id || 1;
    return this.mappingService.createStatement(storeId, body.name, body.type, body.description);
  }

  @Post('sections')
  async createSection(@Body() dto: any, @Body('store_id') storeId: number) {
    return this.mappingService.createSection(storeId || 1, dto);
  }

  @Post('mappings')
  async createMapping(@Body() dto: any, @Body('store_id') storeId: number, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.mappingService.mapAccount(storeId || 1, dto, userId);
  }

  @Get(':id/build')
  async buildStatement(
    @Param('id', ParseIntPipe) id: number,
    @Query('store_id', ParseIntPipe) storeId: number,
    @Query('fiscal_year_id', ParseIntPipe) fiscalYearId: number,
    @Query('start_date') startDate: string,
    @Query('end_date') endDate: string,
    @Req() req: any
  ) {
    const userId = req.user?.id || 1;
    return this.builderService.buildStatement(storeId, id, new Date(startDate), new Date(endDate), fiscalYearId, userId);
  }
}
