import { Test, TestingModule } from '@nestjs/testing';
import { BusinessDayController } from './business-day.controller';
import { BusinessDayService } from './business-day.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

// Task #2O-B: all 4 Business-Day routes were migrated off the legacy
// sales.view/sales.create compatibility-bridge codes onto the real
// pos.business_day.read/start/close permissions (see Task #2O's mapping
// analysis and Task #2O-A's role provisioning). These tests pin the actual
// decorator metadata (the source of truth PermissionsGuard reads at
// runtime) so a future edit can't silently drift back to a sales.* string
// or drop the permission requirement entirely. Generic allow/deny
// permission-matching logic is already covered by permissions.guard.spec.ts
// and is intentionally not re-tested here.
describe('BusinessDayController', () => {
  let controller: BusinessDayController;
  let service: {
    getCurrentDay: jest.Mock;
    getDayHistory: jest.Mock;
    startDay: jest.Mock;
    closeDay: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getCurrentDay: jest.fn(),
      getDayHistory: jest.fn(),
      startDay: jest.fn(),
      closeDay: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessDayController],
      providers: [{ provide: BusinessDayService, useValue: service }],
    }).compile();

    controller = module.get<BusinessDayController>(BusinessDayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('@RequirePermissions metadata (Task #2O-B migration)', () => {
    it('GET /business-day/current requires pos.business_day.read, not the legacy sales.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getCurrentDay);
      expect(metadata).toEqual(['pos.business_day.read']);
    });

    it('GET /business-day/history requires pos.business_day.read, not the legacy sales.view', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.getDayHistory);
      expect(metadata).toEqual(['pos.business_day.read']);
    });

    it('POST /business-day/start requires pos.business_day.start, not the legacy sales.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.startDay);
      expect(metadata).toEqual(['pos.business_day.start']);
    });

    it('POST /business-day/close requires pos.business_day.close, not the legacy sales.create', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.closeDay);
      expect(metadata).toEqual(['pos.business_day.close']);
    });
  });

  describe('existing behavior is unchanged by the decorator migration', () => {
    it('getCurrentDay() delegates to service.getCurrentDay with the numeric store_id', () => {
      controller.getCurrentDay('67');
      expect(service.getCurrentDay).toHaveBeenCalledWith(67);
    });

    it('getCurrentDay() still short-circuits with an error when store_id is missing, without touching the service', () => {
      const result = controller.getCurrentDay(undefined as any);
      expect(result).toEqual({ error: 'store_id is required' });
      expect(service.getCurrentDay).not.toHaveBeenCalled();
    });

    it('getDayHistory() delegates to service.getDayHistory with store_id and limit unchanged, defaulting limit to 30', () => {
      controller.getDayHistory('67', undefined);
      expect(service.getDayHistory).toHaveBeenCalledWith(67, 30);

      controller.getDayHistory('67', '10');
      expect(service.getDayHistory).toHaveBeenCalledWith(67, 10);
    });

    it('startDay() delegates to service.startDay with the same body fields, unchanged', () => {
      controller.startDay({ store_id: 67, started_by: 5, openingFloat: 1000 } as any);
      expect(service.startDay).toHaveBeenCalledWith(67, 5, 1000);
    });

    it('closeDay() delegates to service.closeDay with the same body fields, unchanged', () => {
      controller.closeDay({
        store_id: 67,
        closed_by: 5,
        closingCash: 5000,
        notes: 'ok',
      } as any);
      expect(service.closeDay).toHaveBeenCalledWith(67, 5, 5000, 'ok');
    });
  });
});
