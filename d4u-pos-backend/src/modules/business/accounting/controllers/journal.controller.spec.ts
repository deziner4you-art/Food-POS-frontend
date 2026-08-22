import { Test, TestingModule } from '@nestjs/testing';
import { JournalController } from './journal.controller';
import { JournalService } from '../services/journal.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('JournalController', () => {
  let controller: JournalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JournalController],
      providers: [{ provide: JournalService, useValue: {} }],
    }).compile();

    controller = module.get<JournalController>(JournalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 2: migrated off 'finance.accounting.*' onto
  // 'finance.journals.*' (kept as its own resource, separate from
  // finance.journal_entries -- #2R-A/#2R-C found "Journal" and "Journal
  // Entry" are genuinely distinct controllers/lifecycles, not one resource).
  // activate/deactivate fold into the 'update' action. Straight swap per
  // #2R-C3-D's accidental/legacy finding.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/journals requires finance.journals.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findAll)).toEqual(['finance.journals.read']);
    });
    it('GET /accounting/journals/:id requires finance.journals.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findById)).toEqual(['finance.journals.read']);
    });
    it('POST /accounting/journals requires finance.journals.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.create)).toEqual(['finance.journals.create']);
    });
    it('PATCH /accounting/journals/:id requires finance.journals.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.update)).toEqual(['finance.journals.update']);
    });
    it('PATCH /accounting/journals/:id/activate requires finance.journals.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.activate)).toEqual(['finance.journals.update']);
    });
    it('PATCH /accounting/journals/:id/deactivate requires finance.journals.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.deactivate)).toEqual(['finance.journals.update']);
    });
  });
});
