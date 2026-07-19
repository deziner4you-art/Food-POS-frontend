import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountingPeriodService } from '../services/accounting-period.service';
import { CreateAccountingPeriodDto } from '../dto/create-accounting-period.dto';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/periods')
export class AccountingPeriodController {
  constructor(private readonly periodService: AccountingPeriodService) {}

  @Get('fiscal-year/:fy_id')
  async findAllByFiscalYear(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('fy_id', ParseIntPipe) fy_id: number,
  ) {
    return this.periodService.findAllByFiscalYear(store_id, fy_id);
  }

  @Post('monthly')
  async createMonthly(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountingPeriodDto,
  ) {
    return this.periodService.createMonthlyPeriods(store_id, dto);
  }

  @Patch(':id/close')
  async close(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.CLOSED);
  }

  @Patch(':id/open')
  async open(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.OPEN);
  }

  @Patch(':id/lock')
  async lock(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.LOCKED);
  }

  @Patch(':id/unlock')
  async unlock(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // In real app, check for ADMIN permissions here
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.OPEN);
  }
}
