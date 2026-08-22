import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { BankStatementService } from '../services/bank-statement.service';
import { BankReconciliationService } from '../services/bank-reconciliation.service';
import { ReconciliationMatchingService } from '../services/reconciliation-matching.service';
import { getSessionUserId } from '../../../../common/utils/session-context.util';

@Controller('accounting/bank-reconciliation')
export class BankReconciliationController {
  constructor(
    private readonly statementService: BankStatementService,
    private readonly reconciliationService: BankReconciliationService,
    private readonly matchingService: ReconciliationMatchingService
  ) {}

  @RequirePermissions('finance.bank_reconciliation.create')
  @Post('import-statement')
  async importStatement(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.statementService.importStatement(body, userId);
  }

  @RequirePermissions('finance.bank_reconciliation.create')
  @Post('run')
  async runReconciliation(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.reconciliationService.runReconciliation(body, userId);
  }

  @RequirePermissions('finance.bank_reconciliation.create')
  @Post('match')
  async manualMatch(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.matchingService.manualMatch(body, userId);
  }

  @RequirePermissions('finance.bank_reconciliation.create')
  @Post('adjustment')
  async createAdjustment(@Body() body: any, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.reconciliationService.createAdjustment(body, userId);
  }

  @RequirePermissions('finance.bank_reconciliation.create')
  @Post(':id/finalize')
  async finalize(@Param('id') id: string, @Req() req: any) {
    const userId = getSessionUserId(req.user);
    return this.reconciliationService.finalizeReconciliation(Number(id), userId);
  }

  @RequirePermissions('finance.bank_reconciliation.read')
  @Get(':id')
  async getReconciliation(@Param('id') id: string) {
    return this.reconciliationService.getReconciliation(Number(id));
  }
}
