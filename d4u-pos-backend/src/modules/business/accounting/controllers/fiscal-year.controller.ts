import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { FiscalYearService } from '../services/fiscal-year.service';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from '../dto/update-fiscal-year.dto';

@Controller('accounting/fiscal-years')
export class FiscalYearController {
  constructor(private readonly fyService: FiscalYearService) {}

  @RequirePermissions('finance.accounting.view')
  @Get('active')
  async getActive(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.fyService.getActive(store_id);
  }

  @RequirePermissions('finance.accounting.view')
  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.fyService.findAll(store_id);
  }

  @RequirePermissions('finance.accounting.create')
  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateFiscalYearDto,
  ) {
    return this.fyService.create(store_id, dto);
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id')
  async update(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFiscalYearDto,
  ) {
    return this.fyService.update(store_id, id, dto);
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id/close')
  async close(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fyService.close(store_id, id);
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id/open')
  async open(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('is_admin') isAdmin: string,
  ) {
    return this.fyService.open(store_id, id, isAdmin === 'true');
  }
}
