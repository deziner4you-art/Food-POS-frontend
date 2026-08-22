import { Test, TestingModule } from '@nestjs/testing';
import { YearEndClosingController } from './year-end-closing.controller';
import { YearEndClosingService } from '../services/year-end-closing.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('YearEndClosingController', () => {
  let controller: YearEndClosingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [YearEndClosingController],
      providers: [{ provide: YearEndClosingService, useValue: {} }],
    }).compile();

    controller = module.get<YearEndClosingController>(YearEndClosingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 9: migrated onto 'finance.period_closing.execute',
  // reused from month-end -- year-end closing is the same lifecycle
  // action at a different granularity. Excluded from Accountant's scope.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/year-end/execute requires finance.period_closing.execute', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.executeYearEndClosing)).toEqual(['finance.period_closing.execute']);
    });
  });
});
