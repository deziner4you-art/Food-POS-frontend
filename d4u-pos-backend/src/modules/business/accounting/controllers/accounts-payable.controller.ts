import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountsPayableService } from '../services/accounts-payable.service';
import { VendorPaymentService } from '../services/vendor-payment.service';
import { VendorAgingService } from '../services/vendor-aging.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting')
export class AccountsPayableController {
  constructor(
    private readonly payableService: AccountsPayableService,
    private readonly paymentService: VendorPaymentService,
    private readonly agingService: VendorAgingService
  ) {}

  @Post('accounts-payable')
  async createPayable(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.payableService.createPayable(body, userId);
  }

  @Post('vendor-payments')
  async createPayment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.paymentService.postPayment(body, userId);
  }

  @Get('accounts-payable')
  async getPayables(@Req() req: any) {
    return this.payableService.getPayables(req.user?.store_id || 1);
  }

  @Get('accounts-payable/:vendorId')
  async getVendorPayables(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.payableService.getVendorPayables(req.user?.store_id || 1, Number(vendorId));
  }

  @Get('vendor-aging/:vendorId')
  async getVendorAging(@Param('vendorId') vendorId: string, @Req() req: any) {
    return this.agingService.calculateAging({ store_id: req.user?.store_id || 1, vendor_id: Number(vendorId) }, req.user?.id || 1);
  }
}
