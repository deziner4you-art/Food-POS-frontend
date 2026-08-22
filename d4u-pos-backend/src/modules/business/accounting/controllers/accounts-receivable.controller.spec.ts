import { Test, TestingModule } from '@nestjs/testing';
import { AccountsReceivableController } from './accounts-receivable.controller';
import { AccountsReceivableService } from '../services/accounts-receivable.service';
import { CustomerReceiptService } from '../services/customer-receipt.service';
import { CustomerAgingService } from '../services/customer-aging.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('AccountsReceivableController', () => {
  let controller: AccountsReceivableController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsReceivableController],
      providers: [
        { provide: AccountsReceivableService, useValue: {} },
        { provide: CustomerReceiptService, useValue: {} },
        { provide: CustomerAgingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AccountsReceivableController>(AccountsReceivableController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 5: migrated onto 'finance.accounts_receivable.*',
  // included in Accountant's #2R-C1 scope (routine customer bookkeeping).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/accounts-receivable requires finance.accounts_receivable.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createReceivable)).toEqual(['finance.accounts_receivable.create']);
    });
    it('POST /accounting/customer-receipts requires finance.accounts_receivable.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createReceipt)).toEqual(['finance.accounts_receivable.create']);
    });
    it('GET /accounting/accounts-receivable requires finance.accounts_receivable.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getReceivables)).toEqual(['finance.accounts_receivable.read']);
    });
    it('GET /accounting/accounts-receivable/:customerId requires finance.accounts_receivable.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getCustomerReceivables)).toEqual(['finance.accounts_receivable.read']);
    });
    it('GET /accounting/customer-aging/:customerId requires finance.accounts_receivable.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getCustomerAging)).toEqual(['finance.accounts_receivable.read']);
    });
  });
});
