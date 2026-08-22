import { Test, TestingModule } from '@nestjs/testing';
import { CashFlowController } from './cash-flow.controller';
import { CashFlowService } from './cash-flow.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

describe('CashFlowController (POS, src/modules/business/cash-flow/)', () => {
  let controller: CashFlowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashFlowController],
      providers: [{ provide: CashFlowService, useValue: {} }],
    }).compile();

    controller = module.get<CashFlowController>(CashFlowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-E4: migrated off the legacy 'finance.accounting.*' onto
  // 'pos.cash_drawer.record' (#2R-E2/#2R-E3) -- POS-operational cash-drawer
  // activity, not accounting/finance. Straight swap, not additive.
  describe('@RequirePermissions metadata (Task #2R-E4)', () => {
    it('GET /cash-flow requires exactly pos.cash_drawer.record', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getCashFlow) as string[];
      expect(metadata).toEqual(['pos.cash_drawer.record']);
      expect(metadata.some((p) => p.startsWith('finance.accounting.'))).toBe(false);
      expect(metadata.length).toBe(1);
    });

    it('GET /cash-flow/summary requires exactly pos.cash_drawer.record', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getSummary) as string[];
      expect(metadata).toEqual(['pos.cash_drawer.record']);
      expect(metadata.some((p) => p.startsWith('finance.accounting.'))).toBe(false);
      expect(metadata.length).toBe(1);
    });

    it('POST /cash-flow/in requires exactly pos.cash_drawer.record', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.cashIn) as string[];
      expect(metadata).toEqual(['pos.cash_drawer.record']);
      expect(metadata.some((p) => p.startsWith('finance.accounting.'))).toBe(false);
      expect(metadata.length).toBe(1);
    });

    it('POST /cash-flow/out requires exactly pos.cash_drawer.record', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.cashOut) as string[];
      expect(metadata).toEqual(['pos.cash_drawer.record']);
      expect(metadata.some((p) => p.startsWith('finance.accounting.'))).toBe(false);
      expect(metadata.length).toBe(1);
    });

    it('none of the 4 routes use an OR/array of multiple permissions -- exactly one string each', () => {
      const handlers = [
        controller.getCashFlow,
        controller.getSummary,
        controller.cashIn,
        controller.cashOut,
      ];
      for (const handler of handlers) {
        const metadata = Reflect.getMetadata(PERMISSIONS_KEY, handler) as string[];
        expect(Array.isArray(metadata)).toBe(true);
        expect(metadata.length).toBe(1);
      }
    });
  });
});
