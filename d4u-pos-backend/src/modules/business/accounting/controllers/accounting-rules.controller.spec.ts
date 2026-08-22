import { Test, TestingModule } from '@nestjs/testing';
import { AccountingRulesController } from './accounting-rules.controller';
import { AccountingRulesService } from '../services/accounting-rules.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('AccountingRulesController', () => {
  let controller: AccountingRulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountingRulesController],
      providers: [{ provide: AccountingRulesService, useValue: {} }],
    }).compile();

    controller = module.get<AccountingRulesController>(AccountingRulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-E1: migrated off the legacy 'finance.accounting.*' onto
  // 'finance.system_accounts.*' -- #2R-E found this posting-rules-engine
  // config API shares the same conceptual domain and service dependency
  // (AccountingRulesService -> SystemAccountMappingService) as the
  // already-migrated system-account-mapping.controller.ts. Straight swap,
  // Finance-Manager-only: Finance Manager already holds
  // finance.system_accounts.{read,create,update}, Accountant does not
  // (matching the sibling domain's exclusion), no POS role holds it either.
  describe('@RequirePermissions metadata (Task #2R-E1)', () => {
    it('POST /accounting/rules requires exactly finance.system_accounts.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createRule)).toEqual(['finance.system_accounts.create']);
    });
    it('PATCH /accounting/rules/:id requires exactly finance.system_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.updateRule)).toEqual(['finance.system_accounts.update']);
    });
    it('PATCH /accounting/rules/:id/activate requires exactly finance.system_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.activateRule)).toEqual(['finance.system_accounts.update']);
    });
    it('PATCH /accounting/rules/:id/deactivate requires exactly finance.system_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.deactivateRule)).toEqual(['finance.system_accounts.update']);
    });
    it('GET /accounting/rules/:id requires exactly finance.system_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getRule)).toEqual(['finance.system_accounts.read']);
    });
    it('GET /accounting/rules requires exactly finance.system_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.listRules)).toEqual(['finance.system_accounts.read']);
    });

    it('none of the 6 routes retain the old finance.accounting.* permission', () => {
      const handlers = [
        controller.createRule,
        controller.updateRule,
        controller.activateRule,
        controller.deactivateRule,
        controller.getRule,
        controller.listRules,
      ];
      for (const handler of handlers) {
        const metadata = Reflect.getMetadata(PERMISSIONS_KEY, handler) as string[];
        expect(metadata.some((p) => p.startsWith('finance.accounting.'))).toBe(false);
      }
    });
  });
});
