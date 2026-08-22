import { Controller, Get, Post, Put, Param, Body, Query, ParseIntPipe, Patch } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { VoucherService } from '../services/voucher.service';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { UpdateVoucherDto } from '../dto/update-voucher.dto';
import { CancelVoucherDto } from '../dto/cancel-voucher.dto';

@Controller('accounting/vouchers')
export class VoucherController {
  constructor(private readonly service: VoucherService) {}

  @RequirePermissions('finance.vouchers.create')
  @Post()
  async createVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateVoucherDto,
  ) {
    const userId = 1; // mock
    return this.service.createVoucher(store_id, userId, dto);
  }

  @RequirePermissions('finance.vouchers.update')
  @Put(':id')
  async updateVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVoucherDto,
  ) {
    const userId = 1; // mock
    return this.service.updateVoucher(store_id, id, userId, dto);
  }

  @RequirePermissions('finance.vouchers.submit')
  @Patch(':id/submit')
  async submitVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = 1; // mock
    return this.service.submitVoucher(store_id, id, userId);
  }

  @RequirePermissions('finance.vouchers.approve')
  @Patch(':id/approve')
  async approveVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = 1; // mock
    return this.service.approveVoucher(store_id, id, userId);
  }

  @RequirePermissions('finance.vouchers.cancel')
  @Patch(':id/cancel')
  async cancelVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelVoucherDto,
  ) {
    const userId = 1; // mock
    return this.service.cancelVoucher(store_id, id, userId, dto.reason);
  }

  @RequirePermissions('finance.vouchers.reverse')
  @Patch(':id/reverse')
  async reverseVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = 1; // mock
    return this.service.reverseVoucher(store_id, id, userId);
  }

  @RequirePermissions('finance.vouchers.read')
  @Get(':id')
  async getVoucher(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getVoucher(store_id, id);
  }

  @RequirePermissions('finance.vouchers.read')
  @Get()
  async listVouchers(
    @Query('store_id', ParseIntPipe) store_id: number,
  ) {
    return this.service.listVouchers(store_id);
  }
}
