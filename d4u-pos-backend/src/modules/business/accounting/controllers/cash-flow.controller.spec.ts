import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowController } from './cash-flow.controller';
import { CashFlowService } from '../services/cash-flow.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('CashFlowController (accounting/cash-flow, accounting-side)', () => {
  let controller: CashFlowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashFlowController],
      providers: [{ provide: CashFlowService, useValue: {} }],
    }).compile();

    controller = module.get<CashFlowController>(CashFlowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 6: this is the accounting cash-flow-STATEMENT
  // controller (src/modules/business/accounting/controllers/cash-flow.controller.ts),
  // migrated onto the reused 'finance.reports.*' -- distinct from the
  // unrelated POS-side cash-drawer controller at
  // src/modules/business/cash-flow/cash-flow.controller.ts, which shares
  // the same class/file name but is one of the 10 #2R-C3 STOP routes and
  // was NOT touched by this task (verified separately).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/cash-flow requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getCashFlow)).toEqual(['finance.reports.view']);
    });
    it('GET /accounting/cash-flow/export requires finance.reports.export', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.exportCashFlow)).toEqual(['finance.reports.export']);
    });
  });
});
