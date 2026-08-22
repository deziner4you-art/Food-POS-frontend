import { Test, TestingModule } from '@nestjs/testing';
import { FiscalYearController } from './fiscal-year.controller';
import { FiscalYearService } from '../services/fiscal-year.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('FiscalYearController', () => {
  let controller: FiscalYearController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiscalYearController],
      providers: [{ provide: FiscalYearService, useValue: {} }],
    }).compile();

    controller = module.get<FiscalYearController>(FiscalYearController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 4: migrated onto 'finance.fiscal_years.*', kept
  // separate from finance.periods (different granularity: fiscal year vs.
  // monthly accounting period). Fiscal-year control is also excluded from
  // Accountant's scope, reserved for Finance Manager.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/fiscal-years/active requires finance.fiscal_years.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getActive)).toEqual(['finance.fiscal_years.read']);
    });
    it('GET /accounting/fiscal-years requires finance.fiscal_years.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findAll)).toEqual(['finance.fiscal_years.read']);
    });
    it('POST /accounting/fiscal-years requires finance.fiscal_years.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.create)).toEqual(['finance.fiscal_years.create']);
    });
    it('PATCH /accounting/fiscal-years/:id requires finance.fiscal_years.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.update)).toEqual(['finance.fiscal_years.update']);
    });
    it('PATCH /accounting/fiscal-years/:id/close requires finance.fiscal_years.close', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.close)).toEqual(['finance.fiscal_years.close']);
    });
    it('PATCH /accounting/fiscal-years/:id/open requires finance.fiscal_years.open', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.open)).toEqual(['finance.fiscal_years.open']);
    });
  });
});
