import { Test, TestingModule } from '@nestjs/testing';
import { VoucherController } from './voucher.controller';
import { VoucherService } from '../services/voucher.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('VoucherController', () => {
  let controller: VoucherController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoucherController],
      providers: [{ provide: VoucherService, useValue: {} }],
    }).compile();

    controller = module.get<VoucherController>(VoucherController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 3: migrated off 'finance.accounting.*' onto the new
  // 'finance.vouchers.*' resource. Straight swap per #2R-C3-D's
  // accidental/legacy finding for POS-role bridge access.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/vouchers requires finance.vouchers.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.createVoucher)).toEqual(['finance.vouchers.create']);
    });
    it('PUT /accounting/vouchers/:id requires finance.vouchers.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.updateVoucher)).toEqual(['finance.vouchers.update']);
    });
    it('PATCH /accounting/vouchers/:id/submit requires finance.vouchers.submit', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.submitVoucher)).toEqual(['finance.vouchers.submit']);
    });
    it('PATCH /accounting/vouchers/:id/approve requires finance.vouchers.approve', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.approveVoucher)).toEqual(['finance.vouchers.approve']);
    });
    it('PATCH /accounting/vouchers/:id/cancel requires finance.vouchers.cancel', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.cancelVoucher)).toEqual(['finance.vouchers.cancel']);
    });
    it('PATCH /accounting/vouchers/:id/reverse requires finance.vouchers.reverse', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.reverseVoucher)).toEqual(['finance.vouchers.reverse']);
    });
    it('GET /accounting/vouchers/:id requires finance.vouchers.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getVoucher)).toEqual(['finance.vouchers.read']);
    });
    it('GET /accounting/vouchers requires finance.vouchers.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.listVouchers)).toEqual(['finance.vouchers.read']);
    });
  });
});
