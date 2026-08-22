import { Test, TestingModule } from '@nestjs/testing';
import { BalanceSheetController } from './balance-sheet.controller';
import { BalanceSheetService } from '../services/balance-sheet.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('BalanceSheetController', () => {
  let controller: BalanceSheetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceSheetController],
      providers: [{ provide: BalanceSheetService, useValue: {} }],
    }).compile();

    controller = module.get<BalanceSheetController>(BalanceSheetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto reused 'finance.reports.*'.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/balance-sheet requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getBalanceSheet)).toEqual(['finance.reports.view']);
    });
    it('GET /accounting/balance-sheet/export requires finance.reports.export', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.exportBalanceSheet)).toEqual(['finance.reports.export']);
    });
  });
});
