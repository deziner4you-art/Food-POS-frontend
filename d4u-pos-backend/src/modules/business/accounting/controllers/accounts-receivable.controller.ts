import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountsReceivableService } from '../services/accounts-receivable.service';
import { CustomerReceiptService } from '../services/customer-receipt.service';
import { CustomerAgingService } from '../services/customer-aging.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting')
export class AccountsReceivableController {
  constructor(
    private readonly receivableService: AccountsReceivableService,
    private readonly receiptService: CustomerReceiptService,
    private readonly agingService: CustomerAgingService
  ) {}

  @Post('accounts-receivable')
  async createReceivable(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.receivableService.createReceivable(body, userId);
  }

  @Post('customer-receipts')
  async createReceipt(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.receiptService.postReceipt(body, userId);
  }

  @Get('accounts-receivable')
  async getReceivables(@Req() req: any) {
    return this.receivableService.getReceivables(req.user?.store_id || 1);
  }

  @Get('accounts-receivable/:customerId')
  async getCustomerReceivables(@Param('customerId') customerId: string, @Req() req: any) {
    return this.receivableService.getCustomerReceivables(req.user?.store_id || 1, Number(customerId));
  }

  @Get('customer-aging/:customerId')
  async getCustomerAging(@Param('customerId') customerId: string, @Req() req: any) {
    return this.agingService.calculateAging({ store_id: req.user?.store_id || 1, customer_id: Number(customerId) }, req.user?.id || 1);
  }
}
