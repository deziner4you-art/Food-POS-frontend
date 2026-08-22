import { Test, TestingModule } from '@nestjs/testing';
import { ChartOfAccountsController } from './chart-of-accounts.controller';
import { ChartOfAccountsService } from '../services/chart-of-accounts.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('ChartOfAccountsController', () => {
  let controller: ChartOfAccountsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChartOfAccountsController],
      providers: [{ provide: ChartOfAccountsService, useValue: {} }],
    }).compile();

    controller = module.get<ChartOfAccountsController>(ChartOfAccountsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 1: migrated off the coarse, legacy 'finance.accounting.*'
  // onto the real 'finance.chart_of_accounts.*' granular permissions
  // (#2R-C1). Straight swap, not additive -- #2R-C3-D found POS-role bridge
  // access to this route was accidental/legacy (no documented, frontend, or
  // workflow evidence any POS role needs chart-of-accounts access), so the
  // legacy permission is not retained.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/coa/tree requires finance.chart_of_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getTree)).toEqual(['finance.chart_of_accounts.read']);
    });
    it('GET /accounting/coa/search requires finance.chart_of_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.search)).toEqual(['finance.chart_of_accounts.read']);
    });
    it('POST /accounting/coa/groups requires finance.chart_of_accounts.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createGroup)).toEqual(['finance.chart_of_accounts.create']);
    });
    it('POST /accounting/coa/accounts requires finance.chart_of_accounts.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createAccount)).toEqual(['finance.chart_of_accounts.create']);
    });
    it('PATCH /accounting/coa/accounts/:id requires finance.chart_of_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.updateAccount)).toEqual(['finance.chart_of_accounts.update']);
    });
    it('PATCH /accounting/coa/accounts/:id/disable requires finance.chart_of_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.disableAccount)).toEqual(['finance.chart_of_accounts.update']);
    });
    it('PATCH /accounting/coa/accounts/:id/move requires finance.chart_of_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.moveAccount)).toEqual(['finance.chart_of_accounts.update']);
    });
    it('PATCH /accounting/coa/groups/:id/move requires finance.chart_of_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.moveGroup)).toEqual(['finance.chart_of_accounts.update']);
    });
  });
});
