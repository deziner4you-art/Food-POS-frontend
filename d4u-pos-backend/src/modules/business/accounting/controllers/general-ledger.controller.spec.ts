import { Test, TestingModule } from '@nestjs/testing';
import { GeneralLedgerController } from './general-ledger.controller';
import { GeneralLedgerService } from '../services/general-ledger.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('GeneralLedgerController', () => {
  let controller: GeneralLedgerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneralLedgerController],
      providers: [{ provide: GeneralLedgerService, useValue: {} }],
    }).compile();

    controller = module.get<GeneralLedgerController>(GeneralLedgerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 1: migrated onto the pre-existing 'finance.ledgers.read'
  // (already granted to Finance Manager and Auditor) rather than a new
  // permission -- #2R-C3 found this resource already covers exactly this
  // ledger-querying concept. Straight swap per #2R-C3-D's accidental/legacy
  // finding for POS-role bridge access.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/ledger requires finance.ledgers.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.queryLedger)).toEqual(['finance.ledgers.read']);
    });
    it('GET /accounting/ledger/account/:id/balance requires finance.ledgers.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getAccountBalance)).toEqual(['finance.ledgers.read']);
    });
    it('GET /accounting/ledger/trial-balance requires finance.ledgers.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getTrialBalanceData)).toEqual(['finance.ledgers.read']);
    });
  });
});
