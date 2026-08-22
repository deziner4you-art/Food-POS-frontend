import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountsPayableService } from '../services/accounts-payable.service';
import { VendorPaymentService } from '../services/vendor-payment.service';
import { VendorAgingService } from '../services/vendor-aging.service';
import { getSessionStoreId, getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting')
export class AccountsPayableController {
  constructor(
    private readonly payableService: AccountsPayableService,
    private readonly paymentService: VendorPaymentService,
    private readonly agingService: VendorAgingService
  ) {}

  @RequirePermissions('finance.accounts_payable.create')
  @Post('accounts-payable')
  async createPayable(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.payableService.createPayable(body, userId);
  }

  @RequirePermissions('finance.accounts_payable.create')
  @Post('vendor-payments')
  async createPayment(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.paymentService.postPayment(body, userId);
  }

  @RequirePermissions('finance.accounts_payable.read')
  @Get('accounts-payable')
  async getPayables(@Req() req: any) {
    return this.payableService.getPayables(getSessionStoreId(req.user));
  }

  @RequirePermissions('finance.accounts_payable.read')
  @Get('accounts-payable/:vendorId')
  async getVendorPayables(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.payableService.getVendorPayables(getSessionStoreId(req.user), Number(vendorId));
  }

  @RequirePermissions('finance.accounts_payable.read')
  @Get('vendor-aging/:vendorId')
  async getVendorAging(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.agingService.calculateAging({ store_id: getSessionStoreId(req.user), vendor_id: Number(vendorId) }, getSessionUserId(req.user));
  }
}
