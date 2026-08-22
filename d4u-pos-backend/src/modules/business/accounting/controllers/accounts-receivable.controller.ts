import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountsReceivableService } from '../services/accounts-receivable.service';
import { CustomerReceiptService } from '../services/customer-receipt.service';
import { CustomerAgingService } from '../services/customer-aging.service';
import { getSessionStoreId, getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting')
export class AccountsReceivableController {
  constructor(
    private readonly receivableService: AccountsReceivableService,
    private readonly receiptService: CustomerReceiptService,
    private readonly agingService: CustomerAgingService
  ) {}

  @RequirePermissions('finance.accounts_receivable.create')
  @Post('accounts-receivable')
  async createReceivable(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.receivableService.createReceivable(body, userId);
  }

  @RequirePermissions('finance.accounts_receivable.create')
  @Post('customer-receipts')
  async createReceipt(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.receiptService.postReceipt(body, userId);
  }

  @RequirePermissions('finance.accounts_receivable.read')
  @Get('accounts-receivable')
  async getReceivables(@Req() req: any) {
    return this.receivableService.getReceivables(getSessionStoreId(req.user));
  }

  @RequirePermissions('finance.accounts_receivable.read')
  @Get('accounts-receivable/:customerId')
  async getCustomerReceivables(@Param('customerId') customerId: string, @Req() req: any) {
    return this.receivableService.getCustomerReceivables(getSessionStoreId(req.user), Number(customerId));
  }

  @RequirePermissions('finance.accounts_receivable.read')
  @Get('customer-aging/:customerId')
  async getCustomerAging(@Param('customerId') customerId: string, @Req() req: any) {
    return this.agingService.calculateAging({ store_id: getSessionStoreId(req.user), customer_id: Number(customerId) }, getSessionUserId(req.user));
  }
}
