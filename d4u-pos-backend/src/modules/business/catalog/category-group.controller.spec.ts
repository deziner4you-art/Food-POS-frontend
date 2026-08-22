import { Test, TestingModule } from '@nestjs/testing';
import { CategoryGroupController } from './category-group.controller';
import { CategoryGroupService } from './category-group.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

describe('CategoryGroupController', () => {
  let controller: CategoryGroupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryGroupController],
      providers: [{ provide: CategoryGroupService, useValue: {} }],
    }).compile();

    controller = module.get<CategoryGroupController>(CategoryGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-B1: getMenuHierarchy was the one route in this controller still
  // on the legacy 'catalog.view' string while every sibling route already
  // used the real 'catalog.category_group.*' permissions. 'catalog.view' is
  // kept alongside the new grant (additive OR, same pattern as #2Q-B2) --
  // #2R-A found it's only reachable via the posPermissions compatibility
  // bridge, and a straight swap would drop bridge-based access for
  // Cashier/Manager/Business Admin/Business Owner/Branch Owner, none of
  // which hold catalog.category_group.view as a real grant.
  describe('@RequirePermissions metadata (Task #2R-B1)', () => {
    it('GET /catalog/category-groups/hierarchy/menu/:menu_id requires catalog.view OR catalog.category_group.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getMenuHierarchy);
      expect(metadata).toEqual(['catalog.view', 'catalog.category_group.view']);
    });
  });

  // Unrelated routes retain their current authorization decorators,
  // confirming the #2R-B1 change was isolated to getMenuHierarchy.
  describe('unrelated routes are unaffected (Task #2R-B1)', () => {
    it('GET /catalog/category-groups still requires catalog.category_group.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.list);
      expect(metadata).toEqual(['catalog.category_group.view']);
    });

    it('POST /catalog/category-groups still requires catalog.category_group.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.create);
      expect(metadata).toEqual(['catalog.category_group.create']);
    });

    it('DELETE /catalog/category-groups/:id still requires catalog.category_group.delete', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.softDelete);
      expect(metadata).toEqual(['catalog.category_group.delete']);
    });

    it('POST /catalog/category-groups/:id/restore still requires catalog.category_group.restore', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.restore);
      expect(metadata).toEqual(['catalog.category_group.restore']);
    });

    it('getStoreHierarchy is still public (unrelated to this change, sanity check)', () => {
      const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, controller.getStoreHierarchy);
      expect(isPublic).toBe(true);
    });
  });
});
