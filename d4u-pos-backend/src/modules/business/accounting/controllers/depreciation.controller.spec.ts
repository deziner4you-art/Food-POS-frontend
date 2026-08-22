import { Test, TestingModule } from '@nestjs/testing';
import { DepreciationController } from './depreciation.controller';
import { DepreciationService } from '../services/depreciation.service';
import { DepreciationPostingService } from '../services/depreciation-posting.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('DepreciationController', () => {
  let controller: DepreciationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepreciationController],
      providers: [
        { provide: DepreciationService, useValue: {} },
        { provide: DepreciationPostingService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DepreciationController>(DepreciationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 7: migrated onto 'finance.depreciation.*', included
  // in Accountant's #2R-C1 scope (routine depreciation runs/posting).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/depreciation/run requires finance.depreciation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.runDepreciation)).toEqual(['finance.depreciation.create']);
    });
    it('POST /accounting/depreciation/post requires finance.depreciation.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.postDepreciation)).toEqual(['finance.depreciation.create']);
    });
    it('GET /accounting/depreciation/pending requires finance.depreciation.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getPendingSchedules)).toEqual(['finance.depreciation.read']);
    });
    it('GET /accounting/depreciation/:assetId requires finance.depreciation.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getDepreciationHistory)).toEqual(['finance.depreciation.read']);
    });
  });
});
