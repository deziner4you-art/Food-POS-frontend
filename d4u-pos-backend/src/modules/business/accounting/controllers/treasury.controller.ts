import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { TreasuryService } from '../services/treasury.service';
import { BankTransferService } from '../services/bank-transfer.service';
import { CashPositionService } from '../services/cash-position.service';
import { CashForecastService } from '../services/cash-forecast.service';

@Controller('accounting/treasury')
export class TreasuryController {
  constructor(
    private readonly treasuryService: TreasuryService,
    private readonly transferService: BankTransferService,
    private readonly positionService: CashPositionService,
    private readonly forecastService: CashForecastService
  ) {}

  @RequirePermissions('finance.accounting.create')
  @Post('bank-transfer')
  async createTransfer(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.transferService.transfer(body, userId);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('cash-adjustment')
  async createAdjustment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.treasuryService.createCashAdjustment(body, userId);
  }

  @RequirePermissions('finance.accounting.view')
  @Get('bank-accounts')
  async getBankAccounts(@Req() req: any) {
    return this.treasuryService.getBankAccounts(req.user?.store_id || 1);
  }

  @RequirePermissions('finance.accounting.view')
  @Get('cash-position/:accountId')
  async getCashPosition(@Param('accountId') accountId: string, @Req() req: any) {
    return this.positionService.updateCashPosition({ store_id: req.user?.store_id || 1, bank_account_id: Number(accountId) }, req.user?.id || 1);
  }

  @RequirePermissions('finance.accounting.create')
  @Post('cash-forecast')
  async generateForecast(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.forecastService.generateForecast(body, userId);
  }
}
