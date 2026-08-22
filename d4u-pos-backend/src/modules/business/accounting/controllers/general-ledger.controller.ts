import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { GeneralLedgerService } from '../services/general-ledger.service';
import { LedgerQueryDto } from '../dto/ledger-query.dto';

@Controller('accounting/ledger')
export class GeneralLedgerController {
  constructor(private readonly service: GeneralLedgerService) {}

  @RequirePermissions('finance.ledgers.read')
  @Get()
  async queryLedger(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Query() query: LedgerQueryDto,
  ) {
    return this.service.queryLedger(store_id, query);
  }

  @RequirePermissions('finance.ledgers.read')
  @Get('account/:id/balance')
  async getAccountBalance(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getAccountBalance(store_id, id);
  }

  @RequirePermissions('finance.ledgers.read')
  @Get('trial-balance')
  async getTrialBalanceData(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Query() query: LedgerQueryDto,
  ) {
    return this.service.getTrialBalanceData(store_id, query);
  }
}
