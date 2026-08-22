import { Test, TestingModule } from '@nestjs/testing';
import { FixedAssetController } from './fixed-asset.controller';
import { FixedAssetService } from '../services/fixed-asset.service';
import { AssetTransferService } from '../services/asset-transfer.service';
import { AssetDisposalService } from '../services/asset-disposal.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('FixedAssetController', () => {
  let controller: FixedAssetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FixedAssetController],
      providers: [
        { provide: FixedAssetService, useValue: {} },
        { provide: AssetTransferService, useValue: {} },
        { provide: AssetDisposalService, useValue: {} },
      ],
    }).compile();

    controller = module.get<FixedAssetController>(FixedAssetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 7: migrated onto 'finance.fixed_assets.*'. create/read
  // are in Accountant's #2R-C1 scope; transfer/dispose are excluded
  // (reserved for Finance Manager -- disposing of an asset off the books
  // warrants a second set of eyes).
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/fixed-assets requires finance.fixed_assets.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createAsset)).toEqual(['finance.fixed_assets.create']);
    });
    it('GET /accounting/fixed-assets requires finance.fixed_assets.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getAssets)).toEqual(['finance.fixed_assets.read']);
    });
    it('GET /accounting/fixed-assets/:id requires finance.fixed_assets.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getAssetById)).toEqual(['finance.fixed_assets.read']);
    });
    it('PATCH /accounting/fixed-assets/:id requires finance.fixed_assets.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.updateAsset)).toEqual(['finance.fixed_assets.update']);
    });
    it('POST /accounting/fixed-assets/transfer requires finance.fixed_assets.transfer', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.transferAsset)).toEqual(['finance.fixed_assets.transfer']);
    });
    it('POST /accounting/fixed-assets/dispose requires finance.fixed_assets.dispose', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.disposeAsset)).toEqual(['finance.fixed_assets.dispose']);
    });
  });
});
