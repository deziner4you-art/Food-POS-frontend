import { Test, TestingModule } from '@nestjs/testing';
import { KotsController } from './kots.controller';
import { KotsService } from './kots.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';
import { REQUIRED_MODULE_KEY } from '../../../common/decorators/require-module.decorator';
import { PrismaService } from '../../../database/prisma/prisma.service';

// Task #2P-B: the 3 KOT read routes were migrated off the legacy
// sales.view compatibility-bridge code onto the real kitchen.tickets.read
// permission (see Task #2P's mapping analysis and Task #2P-A's role
// provisioning). These tests pin the actual decorator metadata (the source
// of truth PermissionsGuard reads at runtime) so a future edit can't
// silently drift back to sales.* or drop the permission requirement
// entirely. Generic allow/deny permission-matching logic is already
// covered by permissions.guard.spec.ts and is intentionally not re-tested
// here.
//
// Task #2P-I: the legacy PATCH /:id/status route (and its updateStatus
// controller method) has been removed -- confirmed, repo-wide, to have zero
// remaining callers after Task #2P-H migrated StitchKDS.tsx onto /accept
// and /bump. KotsService.updateKotStatus itself is NOT removed -- acceptKOT/
// bumpKOT/cancelKOT still depend on it (see kots.service.spec.ts).
describe('KotsController', () => {
  let controller: KotsController;
  let service: {
    getActiveKots: jest.Mock;
    getKotsByDay: jest.Mock;
    getKot: jest.Mock;
    acceptKOT: jest.Mock;
    bumpKOT: jest.Mock;
    cancelKOT: jest.Mock;
    incrementPrintCount: jest.Mock;
    getTvBoardKots: jest.Mock;
  };
  const user = { sub: 'terminal-session-5', role: 'Chef', active_store_id: 67, active_brand_id: 10 };

  beforeEach(async () => {
    service = {
      getActiveKots: jest.fn(),
      getKotsByDay: jest.fn(),
      getKot: jest.fn(),
      acceptKOT: jest.fn(),
      bumpKOT: jest.fn(),
      cancelKOT: jest.fn(),
      incrementPrintCount: jest.fn(),
      getTvBoardKots: jest.fn(),
    };
    const prisma = {
      store: { findUnique: jest.fn().mockResolvedValue({ id: 67, brand_id: 10 }) },
      user: { findUnique: jest.fn() },
    };
    service.getKot.mockResolvedValue({ id: 42, store_id: 67 });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KotsController],
      providers: [
        { provide: KotsService, useValue: service },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<KotsController>(KotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires TV_BOARD for the dedicated TV feed instead of inheriting KOT_PRINT', () => {
    expect(Reflect.getMetadata(REQUIRED_MODULE_KEY, controller.getTvBoardKots)).toBe('TV_BOARD');
  });

  describe('@RequirePermissions metadata (Task #2P-B migration)', () => {
    it('GET /kots requires kitchen.tickets.read, not the legacy sales.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getActiveKots);
      expect(metadata).toEqual(['kitchen.tickets.read']);
    });

    it('GET /kots/tv-board requires kitchen.tickets.read', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getTvBoardKots);
      expect(metadata).toEqual(['kitchen.tickets.read']);
    });

    it('GET /kots/history requires kitchen.tickets.read, not the legacy sales.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getKotsByDay);
      expect(metadata).toEqual(['kitchen.tickets.read']);
    });

    it('GET /kots/:id requires kitchen.tickets.read, not the legacy sales.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getKot);
      expect(metadata).toEqual(['kitchen.tickets.read']);
    });

    it('POST /kots/:id/print is untouched -- still requires the legacy sales.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.incrementPrint);
      expect(metadata).toEqual(['sales.create']);
    });
  });

  // Task #2P-G: the shared PATCH /:id/status endpoint was split into three
  // independently-authorized routes so PREPARING/READY/CANCELLED can each
  // be granted or withheld separately, rather than all sharing one bucket
  // permission.
  describe('@RequirePermissions metadata (Task #2P-G route split)', () => {
    it('PATCH /kots/:id/accept requires exactly kitchen.tickets.accept', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.acceptKot);
      expect(metadata).toEqual(['kitchen.tickets.accept']);
    });

    it('PATCH /kots/:id/bump requires exactly kitchen.tickets.bump', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.bumpKot);
      expect(metadata).toEqual(['kitchen.tickets.bump']);
    });

    it('PATCH /kots/:id/cancel requires exactly kitchen.tickets.cancel', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.cancelKot);
      expect(metadata).toEqual(['kitchen.tickets.cancel']);
    });
  });

  // Task #2P-I: repo-wide audit confirmed zero remaining callers of
  // PATCH /kots/:id/status (StitchKDS.tsx was the only one, migrated in
  // #2P-H) -- the route and its updateStatus controller method were removed.
  describe('legacy PATCH /kots/:id/status route removal (Task #2P-I)', () => {
    it('updateStatus no longer exists on the controller', () => {
      expect((controller as any).updateStatus).toBeUndefined();
    });
  });

  describe('new route handlers take no client-supplied status (Task #2P-G)', () => {
    it('acceptKot() takes only an id -- there is no body/status parameter for a caller to override', async () => {
      expect(controller.acceptKot.length).toBe(2);
      await controller.acceptKot(user, '42');
      expect(service.acceptKOT).toHaveBeenCalledWith(42);
    });

    it('bumpKot() takes only an id -- there is no body/status parameter for a caller to override', async () => {
      expect(controller.bumpKot.length).toBe(2);
      await controller.bumpKot(user, '42');
      expect(service.bumpKOT).toHaveBeenCalledWith(42);
    });

    it('cancelKot() takes only an id -- there is no body/status parameter for a caller to override', async () => {
      expect(controller.cancelKot.length).toBe(2);
      await controller.cancelKot(user, '42');
      expect(service.cancelKOT).toHaveBeenCalledWith(42);
    });
  });

  describe('existing behavior is unchanged by the decorator migration', () => {
    it('getActiveKots() delegates to service.getActiveKots with numeric store_id and the includeReady flag unchanged', async () => {
      await controller.getActiveKots(user, '67', 'true');
      expect(service.getActiveKots).toHaveBeenCalledWith(67, true);

      await controller.getActiveKots(user, '67', undefined);
      expect(service.getActiveKots).toHaveBeenCalledWith(67, false);
    });

    it('getTvBoardKots() delegates to the scoped active KOT query', async () => {
      await controller.getTvBoardKots(user, '67', 'true');
      expect(service.getActiveKots).toHaveBeenCalledWith(67, true);
    });

    it('getKotsByDay() delegates to service.getKotsByDay with numeric store_id/business_day_id unchanged', async () => {
      await controller.getKotsByDay(user, '67', '5');
      expect(service.getKotsByDay).toHaveBeenCalledWith(67, 5);
    });

    it('getKot() delegates to service.getKot with the numeric id unchanged', async () => {
      await controller.getKot(user, '42');
      expect(service.getKot).toHaveBeenCalledWith(42);
    });

    it('incrementPrint() still delegates to service.incrementPrintCount with the same argument', async () => {
      await controller.incrementPrint(user, '42');
      expect(service.incrementPrintCount).toHaveBeenCalledWith(42);
    });
  });
});
