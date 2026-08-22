import { Test, TestingModule } from '@nestjs/testing';
import { FinancialExportController } from './financial-export.controller';
import { FinancialExportService } from '../services/financial-export.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('FinancialExportController', () => {
  let controller: FinancialExportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialExportController],
      providers: [{ provide: FinancialExportService, useValue: {} }],
    }).compile();

    controller = module.get<FinancialExportController>(FinancialExportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto reused 'finance.reports.export' --
  // the current action was 'create'-shaped in the legacy string, but the
  // route is semantically an export utility, so it realigns onto .export
  // per #2R-C3's medium-confidence mapping.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/export requires finance.reports.export', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.exportReport)).toEqual(['finance.reports.export']);
    });
  });
});
