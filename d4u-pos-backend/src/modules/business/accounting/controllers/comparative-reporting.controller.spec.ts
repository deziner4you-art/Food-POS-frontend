import { Test, TestingModule } from '@nestjs/testing';
import { ComparativeReportingController } from './comparative-reporting.controller';
import { ComparativeReportingService } from '../services/comparative-reporting.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('ComparativeReportingController', () => {
  let controller: ComparativeReportingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComparativeReportingController],
      providers: [{ provide: ComparativeReportingService, useValue: {} }],
    }).compile();

    controller = module.get<ComparativeReportingController>(ComparativeReportingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto reused 'finance.reports.view'.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/comparative requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getComparativeReport)).toEqual(['finance.reports.view']);
    });
  });
});
