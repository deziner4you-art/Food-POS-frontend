import { Test, TestingModule } from '@nestjs/testing';
import { PosOrdersController } from './pos-orders.controller';
import { PosOrdersService } from './pos-orders.service';
import { PERMISSIONS_KEY } from '../../../common/decorators/permissions.decorator';

// Task #2Q-B2: delivery.dispatch.update_status added to PATCH /:id/status as
// an additional accepted permission (OR semantics) so a Rider progressing
// their own POS-native delivery (RIDER_ARRIVED/OUT_FOR_DELIVERY/DELIVERED/
// etc., see d4u-rider's updateBridgeStatus) can reach this route without
// touching staff's existing pos.orders.update-based access at all. Sibling
// fix to online-orders.controller.ts's PATCH /:id. Rider-ownership
// enforcement (Order.rider_id match) is #2Q-B3, not yet implemented.
describe('PosOrdersController', () => {
  let controller: PosOrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosOrdersController],
      providers: [{ provide: PosOrdersService, useValue: {} }],
    }).compile();

    controller = module.get<PosOrdersController>(PosOrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('@RequirePermissions metadata (Task #2Q-B2)', () => {
    it('PATCH /pos-orders/:id/status accepts both pos.orders.update (existing staff access) and delivery.dispatch.update_status (new Rider access)', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.updateDeliveryStatus);
      expect(metadata).toEqual(['pos.orders.update', 'delivery.dispatch.update_status']);
    });

    it('PATCH /pos-orders/:id/void is untouched -- still requires only pos.orders.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.voidOrder);
      expect(metadata).toEqual(['pos.orders.update']);
    });

    it('PATCH /pos-orders/:id/settle is untouched -- still requires only pos.orders.update', () => {
      const metadata = Reflect.getMetadata(PERMISSIONS_KEY, controller.settleOrder);
      expect(metadata).toEqual(['pos.orders.update']);
    });
  });
});
