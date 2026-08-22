import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

// Task #2N-B: GET /tables and PATCH /:id/release were migrated off the
// legacy sales.view/sales.update compatibility-bridge codes onto the real
// pos.tables.manage permission. These tests pin the actual decorator
// metadata (the source of truth PermissionsGuard reads at runtime) so a
// future edit can't silently drift back to a sales.* string or drop the
// permission requirement entirely. Generic allow/deny permission-matching
// logic is already covered by permissions.guard.spec.ts and is intentionally
// not re-tested here.
describe('TablesController', () => {
  let controller: TablesController;
  let service: { listTables: jest.Mock; releaseTable: jest.Mock };

  beforeEach(async () => {
    service = {
      listTables: jest.fn(),
      releaseTable: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [{ provide: TablesService, useValue: service }],
    }).compile();

    controller = module.get<TablesController>(TablesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('@RequirePermissions metadata (Task #2N-B migration)', () => {
    it('GET /tables requires pos.tables.manage, not the legacy sales.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.list);
      expect(metadata).toEqual(['pos.tables.manage']);
    });

    it('PATCH /tables/:id/release requires pos.tables.manage, not the legacy sales.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.release);
      expect(metadata).toEqual(['pos.tables.manage']);
    });
  });

  describe('existing behavior is unchanged by the decorator migration', () => {
    it('list() validates tenant access and delegates to service.listTables with the same store_id', () => {
      const user = { sub: 42, active_store_id: 67 };
      controller.list(user, '67');
      expect(service.listTables).toHaveBeenCalledWith(67);
    });

    it('list() still rejects a caller whose store does not match the requested store_id', () => {
      const user = { role: 'Cashier', store_id: 1 };
      expect(() => controller.list(user, '99')).toThrow(ForbiddenException);
      expect(service.listTables).not.toHaveBeenCalled();
    });

    it('release() validates tenant access and delegates to service.releaseTable with the same store_id/table id', () => {
      const user = { sub: 42, active_store_id: 67 };
      controller.release(user, '5', { store_id: 67 } as any);
      expect(service.releaseTable).toHaveBeenCalledWith(67, 5);
    });

    it('release() still rejects a caller whose store does not match the body store_id', () => {
      const user = { role: 'Manager', store_id: 1 };
      expect(() => controller.release(user, '5', { store_id: 99 } as any)).toThrow(
        ForbiddenException,
      );
      expect(service.releaseTable).not.toHaveBeenCalled();
    });
  });
});
