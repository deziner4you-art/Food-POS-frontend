import { Test, TestingModule } from '@nestjs/testing';
import { TrialBalanceController } from './trial-balance.controller';
import { TrialBalanceService } from '../services/trial-balance.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('TrialBalanceController', () => {
  let controller: TrialBalanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrialBalanceController],
      providers: [{ provide: TrialBalanceService, useValue: {} }],
    }).compile();

    controller = module.get<TrialBalanceController>(TrialBalanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 1: migrated onto the pre-existing 'finance.reports.*'
  // per the same reporting-reuse reasoning as general-ledger-report.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/trial-balance requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getTrialBalance)).toEqual(['finance.reports.view']);
    });
    it('GET /accounting/trial-balance/export requires finance.reports.export', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.exportTrialBalance)).toEqual(['finance.reports.export']);
    });
  });
});
