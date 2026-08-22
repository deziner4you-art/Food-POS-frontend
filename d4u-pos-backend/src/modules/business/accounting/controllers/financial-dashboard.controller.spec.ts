import { Test, TestingModule } from '@nestjs/testing';
import { FinancialDashboardController } from './financial-dashboard.controller';
import { FinancialDashboardService } from '../services/financial-dashboard.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('FinancialDashboardController', () => {
  let controller: FinancialDashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialDashboardController],
      providers: [{ provide: FinancialDashboardService, useValue: {} }],
    }).compile();

    controller = module.get<FinancialDashboardController>(FinancialDashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto reused 'finance.reports.view'.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/dashboard requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getDashboard)).toEqual(['finance.reports.view']);
    });
  });
});
