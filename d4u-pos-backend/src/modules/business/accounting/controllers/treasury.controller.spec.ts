import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryController } from './treasury.controller';
import { TreasuryService } from '../services/treasury.service';
import { BankTransferService } from '../services/bank-transfer.service';
import { CashPositionService } from '../services/cash-position.service';
import { CashForecastService } from '../services/cash-forecast.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('TreasuryController', () => {
  let controller: TreasuryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TreasuryController],
      providers: [
        { provide: TreasuryService, useValue: {} },
        { provide: BankTransferService, useValue: {} },
        { provide: CashPositionService, useValue: {} },
        { provide: CashForecastService, useValue: {} },
      ],
    }).compile();

    controller = module.get<TreasuryController>(TreasuryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 6: migrated onto 'finance.treasury.*'. Excluded from
  // Accountant's #2R-C1 scope -- moving money (transfers/forecasts) is
  // reserved for Finance Manager.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/treasury/bank-transfer requires finance.treasury.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createTransfer)).toEqual(['finance.treasury.create']);
    });
    it('POST /accounting/treasury/cash-adjustment requires finance.treasury.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createAdjustment)).toEqual(['finance.treasury.create']);
    });
    it('GET /accounting/treasury/bank-accounts requires finance.treasury.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getBankAccounts)).toEqual(['finance.treasury.read']);
    });
    it('GET /accounting/treasury/cash-position/:accountId requires finance.treasury.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getCashPosition)).toEqual(['finance.treasury.read']);
    });
    it('POST /accounting/treasury/cash-forecast requires finance.treasury.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.generateForecast)).toEqual(['finance.treasury.create']);
    });
  });
});
