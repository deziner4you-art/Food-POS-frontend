import { Test, TestingModule } from '@nestjs/testing';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { BankStatementService } from '../services/bank-statement.service';
import { BankReconciliationService } from '../services/bank-reconciliation.service';
import { ReconciliationMatchingService } from '../services/reconciliation-matching.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('BankReconciliationController', () => {
  let controller: BankReconciliationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankReconciliationController],
      providers: [
        { provide: BankStatementService, useValue: {} },
        { provide: BankReconciliationService, useValue: {} },
        { provide: ReconciliationMatchingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<BankReconciliationController>(BankReconciliationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 6: migrated onto 'finance.bank_reconciliation.*',
  // included in Accountant's #2R-C1 scope (routine reconciliation work).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/bank-reconciliation/import-statement requires finance.bank_reconciliation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.importStatement)).toEqual(['finance.bank_reconciliation.create']);
    });
    it('POST /accounting/bank-reconciliation/run requires finance.bank_reconciliation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.runReconciliation)).toEqual(['finance.bank_reconciliation.create']);
    });
    it('POST /accounting/bank-reconciliation/match requires finance.bank_reconciliation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.manualMatch)).toEqual(['finance.bank_reconciliation.create']);
    });
    it('POST /accounting/bank-reconciliation/adjustment requires finance.bank_reconciliation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createAdjustment)).toEqual(['finance.bank_reconciliation.create']);
    });
    it('POST /accounting/bank-reconciliation/:id/finalize requires finance.bank_reconciliation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.finalize)).toEqual(['finance.bank_reconciliation.create']);
    });
    it('GET /accounting/bank-reconciliation/:id requires finance.bank_reconciliation.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getReconciliation)).toEqual(['finance.bank_reconciliation.read']);
    });
  });
});
