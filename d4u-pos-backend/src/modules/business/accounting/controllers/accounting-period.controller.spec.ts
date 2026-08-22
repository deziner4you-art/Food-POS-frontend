import { Test, TestingModule } from '@nestjs/testing';
import { AccountingPeriodController } from './accounting-period.controller';
import { AccountingPeriodService } from '../services/accounting-period.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('AccountingPeriodController', () => {
  let controller: AccountingPeriodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountingPeriodController],
      providers: [{ provide: AccountingPeriodService, useValue: {} }],
    }).compile();

    controller = module.get<AccountingPeriodController>(AccountingPeriodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 4: migrated onto 'finance.periods.*'. Note this
  // domain (open/close/lock/unlock) is deliberately excluded from
  // Accountant's #2R-C1 scope -- segregation of duties, reserved for
  // Finance Manager (#2R-C2).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/periods/fiscal-year/:fy_id requires finance.periods.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findAllByFiscalYear)).toEqual(['finance.periods.read']);
    });
    it('POST /accounting/periods/monthly requires finance.periods.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createMonthly)).toEqual(['finance.periods.create']);
    });
    it('PATCH /accounting/periods/:id/close requires finance.periods.close', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.close)).toEqual(['finance.periods.close']);
    });
    it('PATCH /accounting/periods/:id/open requires finance.periods.open', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.open)).toEqual(['finance.periods.open']);
    });
    it('PATCH /accounting/periods/:id/lock requires finance.periods.lock', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.lock)).toEqual(['finance.periods.lock']);
    });
    it('PATCH /accounting/periods/:id/unlock requires finance.periods.unlock', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.unlock)).toEqual(['finance.periods.unlock']);
    });
  });
});
