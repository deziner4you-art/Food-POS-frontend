import { Test, TestingModule } from '@nestjs/testing';
import { GeneralLedgerReportController } from './general-ledger-report.controller';
import { GeneralLedgerReportService } from '../services/general-ledger-report.service';
import { GeneralLedgerDrilldownService } from '../services/general-ledger-drilldown.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('GeneralLedgerReportController', () => {
  let controller: GeneralLedgerReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneralLedgerReportController],
      providers: [
        { provide: GeneralLedgerReportService, useValue: {} },
        { provide: GeneralLedgerDrilldownService, useValue: {} },
      ],
    }).compile();

    controller = module.get<GeneralLedgerReportController>(GeneralLedgerReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 1: migrated onto the pre-existing 'finance.reports.*'
  // (already granted to Finance Manager, and .view to Accountant) -- #2R-C3
  // found this is a pure reporting/viewing concern, reusing the existing
  // resource rather than a new one. Straight swap per #2R-C3-D.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/general-ledger-report requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getGeneralLedger)).toEqual(['finance.reports.view']);
    });
    it('GET /accounting/general-ledger-report/export requires finance.reports.export', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.exportGeneralLedger)).toEqual(['finance.reports.export']);
    });
    it('GET /accounting/general-ledger-report/:glLineId/drilldown requires finance.reports.view', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.drilldown)).toEqual(['finance.reports.view']);
    });
  });
});
