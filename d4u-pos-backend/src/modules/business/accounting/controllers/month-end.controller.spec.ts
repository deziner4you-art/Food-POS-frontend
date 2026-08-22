import { Test, TestingModule } from '@nestjs/testing';
import { MonthEndController } from './month-end.controller';
import { MonthEndClosingService } from '../services/month-end-closing.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('MonthEndController', () => {
  let controller: MonthEndController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonthEndController],
      providers: [{ provide: MonthEndClosingService, useValue: {} }],
    }).compile();

    controller = module.get<MonthEndController>(MonthEndController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 9: migrated onto 'finance.period_closing.*'. Fully
  // excluded from Accountant's #2R-C1 scope -- period closing is the most
  // sensitive operation in the whole cluster, reserved for Finance Manager.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/month-end/execute requires finance.period_closing.execute', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.executeMonthEnd)).toEqual(['finance.period_closing.execute']);
    });
    it('POST /accounting/month-end/rollback/:periodId requires finance.period_closing.rollback', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.rollbackMonthEnd)).toEqual(['finance.period_closing.rollback']);
    });
  });
});
