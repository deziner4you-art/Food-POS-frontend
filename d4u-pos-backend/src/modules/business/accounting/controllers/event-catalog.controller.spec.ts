import { Test, TestingModule } from '@nestjs/testing';
import { EventCatalogController } from './event-catalog.controller';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('EventCatalogController', () => {
  let controller: EventCatalogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventCatalogController],
    }).compile();

    controller = module.get<EventCatalogController>(EventCatalogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 9: folded into 'finance.system_accounts.read' per
  // #2R-C's approved decision to treat system-account-mapping + event
  // catalog as one conceptual configuration domain.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/event-catalog requires finance.system_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getCatalog)).toEqual(['finance.system_accounts.read']);
    });
    it('GET /accounting/event-catalog/:event requires finance.system_accounts.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.getEventMapping)).toEqual(['finance.system_accounts.read']);
    });
  });
});
