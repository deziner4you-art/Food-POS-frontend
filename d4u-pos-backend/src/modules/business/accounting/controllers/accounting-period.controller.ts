import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountingPeriodService } from '../services/accounting-period.service';
import { CreateAccountingPeriodDto } from '../dto/create-accounting-period.dto';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Controller('accounting/periods')
export class AccountingPeriodController {
  constructor(private readonly periodService: AccountingPeriodService) {}

  @RequirePermissions('finance.periods.read')
  @Get('fiscal-year/:fy_id')
  async findAllByFiscalYear(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('fy_id', ParseIntPipe) fy_id: number,
  ) {
    return this.periodService.findAllByFiscalYear(store_id, fy_id);
  }

  @RequirePermissions('finance.periods.create')
  @Post('monthly')
  async createMonthly(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountingPeriodDto,
  ) {
    return this.periodService.createMonthlyPeriods(store_id, dto);
  }

  @RequirePermissions('finance.periods.close')
  @Patch(':id/close')
  async close(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.CLOSED);
  }

  @RequirePermissions('finance.periods.open')
  @Patch(':id/open')
  async open(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.OPEN);
  }

  @RequirePermissions('finance.periods.lock')
  @Patch(':id/lock')
  async lock(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.LOCKED);
  }

  @RequirePermissions('finance.periods.unlock')
  @Patch(':id/unlock')
  async unlock(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // In real app, check for ADMIN permissions here
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.OPEN);
  }
}
