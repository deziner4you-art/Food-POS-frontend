import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from './budget.controller';
import { BudgetService } from '../services/budget.service';
import { BudgetAnalysisService } from '../services/budget-analysis.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('BudgetController', () => {
  let controller: BudgetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        { provide: BudgetService, useValue: {} },
        { provide: BudgetAnalysisService, useValue: {} },
      ],
    }).compile();

    controller = module.get<BudgetController>(BudgetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 7: migrated onto 'finance.budgets.*'. Only .read is in
  // Accountant's #2R-C1 scope (view budget-vs-actual); create/approve are
  // planning/approval functions reserved for Finance Manager.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/budget requires finance.budgets.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createBudget)).toEqual(['finance.budgets.create']);
    });
    it('PUT /accounting/budget/:id/approve requires finance.budgets.approve', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.approveBudget)).toEqual(['finance.budgets.approve']);
    });
    it('GET /accounting/budget/vs-actual requires finance.budgets.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getBudgetVsActual)).toEqual(['finance.budgets.read']);
    });
  });
});
