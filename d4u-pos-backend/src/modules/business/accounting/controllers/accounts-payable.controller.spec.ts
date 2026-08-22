import { Test, TestingModule } from '@nestjs/testing';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from '../services/accounts-payable.service';
import { VendorPaymentService } from '../services/vendor-payment.service';
import { VendorAgingService } from '../services/vendor-aging.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('AccountsPayableController', () => {
  let controller: AccountsPayableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsPayableController],
      providers: [
        { provide: AccountsPayableService, useValue: {} },
        { provide: VendorPaymentService, useValue: {} },
        { provide: VendorAgingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AccountsPayableController>(AccountsPayableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 5: migrated onto 'finance.accounts_payable.*',
  // included in Accountant's #2R-C1 scope (routine vendor bookkeeping).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/accounts-payable requires finance.accounts_payable.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createPayable)).toEqual(['finance.accounts_payable.create']);
    });
    it('POST /accounting/vendor-payments requires finance.accounts_payable.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createPayment)).toEqual(['finance.accounts_payable.create']);
    });
    it('GET /accounting/accounts-payable requires finance.accounts_payable.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getPayables)).toEqual(['finance.accounts_payable.read']);
    });
    it('GET /accounting/accounts-payable/:vendorId requires finance.accounts_payable.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getVendorPayables)).toEqual(['finance.accounts_payable.read']);
    });
    it('GET /accounting/vendor-aging/:vendorId requires finance.accounts_payable.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getVendorAging)).toEqual(['finance.accounts_payable.read']);
    });
  });
});
