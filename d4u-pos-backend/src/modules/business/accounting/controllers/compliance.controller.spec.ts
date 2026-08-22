import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from '../services/compliance.service';
import { SystemCertificationService } from '../services/system-certification.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('ComplianceController', () => {
  let controller: ComplianceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        { provide: ComplianceService, useValue: {} },
        { provide: SystemCertificationService, useValue: {} },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 9: migrated onto 'finance.compliance.*'. .read is in
  // Accountant's #2R-C1 scope; .create (running compliance/certification
  // checks) is reserved for Finance Manager -- final compliance/
  // certification authority is explicitly excluded from Accountant.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /system/compliance/run requires finance.compliance.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.runCompliance)).toEqual(['finance.compliance.create']);
    });
    it('POST /system/certification/run requires finance.compliance.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.runCertification)).toEqual(['finance.compliance.create']);
    });
    it('GET /system/compliance requires finance.compliance.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getComplianceChecks)).toEqual(['finance.compliance.read']);
    });
    it('GET /system/certification requires finance.compliance.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getCertification)).toEqual(['finance.compliance.read']);
    });
    it('GET /system/golive-status requires finance.compliance.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getGoLiveStatus)).toEqual(['finance.compliance.read']);
    });
  });
});
