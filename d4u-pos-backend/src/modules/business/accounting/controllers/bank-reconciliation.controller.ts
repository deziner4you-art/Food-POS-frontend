import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { BankStatementService } from '../services/bank-statement.service';
import { BankReconciliationService } from '../services/bank-reconciliation.service';
import { ReconciliationMatchingService } from '../services/reconciliation-matching.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/bank-reconciliation')
export class BankReconciliationController {
  constructor(
    private readonly statementService: BankStatementService,
    private readonly reconciliationService: BankReconciliationService,
    private readonly matchingService: ReconciliationMatchingService
  ) {}

  @Post('import-statement')
  async importStatement(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.statementService.importStatement(body, userId);
  }

  @Post('run')
  async runReconciliation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.reconciliationService.runReconciliation(body, userId);
  }

  @Post('match')
  async manualMatch(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.matchingService.manualMatch(body, userId);
  }

  @Post('adjustment')
  async createAdjustment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.reconciliationService.createAdjustment(body, userId);
  }

  @Post(':id/finalize')
  async finalize(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.reconciliationService.finalizeReconciliation(Number(id), userId);
  }

  @Get(':id')
  async getReconciliation(@Param('id') id: string) {
    return this.reconciliationService.getReconciliation(Number(id));
  }
}
