import { Test, TestingModule } from '@nestjs/testing';
import { FinancialKpiController } from './financial-kpi.controller';
import { FinancialKpiService } from '../services/financial-kpi.service';
import { FinancialRatioService } from '../services/financial-ratio.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('FinancialKpiController', () => {
  let controller: FinancialKpiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialKpiController],
      providers: [
        { provide: FinancialKpiService, useValue: {} },
        { provide: FinancialRatioService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FinancialKpiController>(FinancialKpiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto reused 'finance.reports.view'.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/kpis requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getKpis)).toEqual(['finance.reports.view']);
    });
    it('GET /accounting/financial-ratios requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getRatios)).toEqual(['finance.reports.view']);
    });
  });
});
