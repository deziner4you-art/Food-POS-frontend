import { Test, TestingModule } from '@nestjs/testing';
import { FinancialStatementController } from './financial-statement.controller';
import { FinancialStatementMappingService } from '../services/financial-statement-mapping.service';
import { FinancialStatementBuilderService } from '../services/financial-statement-builder.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('FinancialStatementController', () => {
  let controller: FinancialStatementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialStatementController],
      providers: [
        { provide: FinancialStatementMappingService, useValue: {} },
        { provide: FinancialStatementBuilderService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FinancialStatementController>(FinancialStatementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 8: migrated onto 'finance.financial_statements.*'
  // (authoring, kept separate from 'finance.reports' viewing per #2R-C's
  // approved decision). Fully excluded from Accountant's #2R-C1 scope --
  // statement authoring is reserved for Finance Manager.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/financial-statements requires finance.financial_statements.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createStatement)).toEqual(['finance.financial_statements.create']);
    });
    it('POST /accounting/financial-statements/sections requires finance.financial_statements.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createSection)).toEqual(['finance.financial_statements.create']);
    });
    it('POST /accounting/financial-statements/mappings requires finance.financial_statements.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createMapping)).toEqual(['finance.financial_statements.create']);
    });
    it('GET /accounting/financial-statements/:id/build requires finance.financial_statements.build', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.buildStatement)).toEqual(['finance.financial_statements.build']);
    });
  });
});
