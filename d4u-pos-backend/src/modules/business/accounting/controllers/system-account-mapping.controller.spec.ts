import { Test, TestingModule } from '@nestjs/testing';
import { SystemAccountMappingController } from './system-account-mapping.controller';
import { SystemAccountMappingService } from '../services/system-account-mapping.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('SystemAccountMappingController', () => {
  let controller: SystemAccountMappingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemAccountMappingController],
      providers: [{ provide: SystemAccountMappingService, useValue: {} }],
    }).compile();

    controller = module.get<SystemAccountMappingController>(SystemAccountMappingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 9: migrated onto 'finance.system_accounts.*'. Fully
  // excluded from Accountant's #2R-C1 scope -- GL account configuration is
  // infrequent setup work reserved for Finance Manager.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/system-accounts requires finance.system_accounts.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.create)).toEqual(['finance.system_accounts.create']);
    });
    it('GET /accounting/system-accounts requires finance.system_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findAll)).toEqual(['finance.system_accounts.read']);
    });
    it('GET /accounting/system-accounts/type/:type requires finance.system_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findByType)).toEqual(['finance.system_accounts.read']);
    });
    it('PATCH /accounting/system-accounts/:id requires finance.system_accounts.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.update)).toEqual(['finance.system_accounts.update']);
    });
  });
});
