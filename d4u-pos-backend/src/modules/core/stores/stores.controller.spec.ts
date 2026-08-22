import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

describe('StoresController', () => {
  let controller: StoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [{ provide: StoresService, useValue: {} }],
    }).compile();

    controller = module.get<StoresController>(StoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-B2: restoreStores/restoreBrands were the only two routes in
  // this controller still on the legacy 'system.update' string while every
  // sibling route already used the real 'workspace.branches.*'/
  // 'workspace.brands.*' permissions. Straight swap, not additive --
  // 'system.update' was never in the posPermissions compatibility bridge, so
  // these routes were reachable only by Super Admin before this change and
  // remain Super-Admin-only after it (no role grant was added for the new
  // 'restore' permissions), a pure rename with zero access change.
  describe('@RequirePermissions metadata (Task #2R-B2)', () => {
    it('POST /stores/recycle-bin/restore-stores requires workspace.branches.restore', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.restoreStores);
      expect(metadata).toEqual(['workspace.branches.restore']);
    });

    it('POST /stores/recycle-bin/restore-brands requires workspace.brands.restore', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.restoreBrands);
      expect(metadata).toEqual(['workspace.brands.restore']);
    });
  });

  // Unrelated routes retain their current authorization decorators,
  // confirming the #2R-B2 change was isolated to the two restore routes.
  describe('unrelated routes are unaffected (Task #2R-B2)', () => {
    it('GET /stores still requires workspace.branches.read and is still public', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getAllStores);
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.getAllStores);
      expect(metadata).toEqual(['workspace.branches.read']);
      expect(isPublic).toBe(true);
    });

    it('POST /stores/bulk-delete still requires workspace.branches.delete', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.bulkDeleteStores);
      expect(metadata).toEqual(['workspace.branches.delete']);
    });

    it('POST /stores/bulk-delete-brands still requires workspace.brands.delete', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.bulkDeleteBrands);
      expect(metadata).toEqual(['workspace.brands.delete']);
    });

    it('POST /stores (createStore) still requires workspace.branches.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.createStore);
      expect(metadata).toEqual(['workspace.branches.create']);
    });

    it('DELETE /stores/:id still requires workspace.branches.delete', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.deleteStore);
      expect(metadata).toEqual(['workspace.branches.delete']);
    });
  });
});
