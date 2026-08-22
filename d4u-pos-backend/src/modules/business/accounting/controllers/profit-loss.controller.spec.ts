import { Test, TestingModule } from '@nestjs/testing';
import { ProfitLossController } from './profit-loss.controller';
import { ProfitLossService } from '../services/profit-loss.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('ProfitLossController', () => {
  let controller: ProfitLossController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfitLossController],
      providers: [{ provide: ProfitLossService, useValue: {} }],
    }).compile();

    controller = module.get<ProfitLossController>(ProfitLossController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto reused 'finance.reports.*'.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/profit-loss requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getProfitLoss)).toEqual(['finance.reports.view']);
    });
    it('GET /accounting/profit-loss/export requires finance.reports.export', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.exportProfitLoss)).toEqual(['finance.reports.export']);
    });
  });
});
