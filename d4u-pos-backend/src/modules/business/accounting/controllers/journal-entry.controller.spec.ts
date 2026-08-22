import { Test, TestingModule } from '@nestjs/testing';
import { JournalEntryController } from './journal-entry.controller';
import { JournalEntryService } from '../services/journal-entry.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('JournalEntryController', () => {
  let controller: JournalEntryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JournalEntryController],
      providers: [{ provide: JournalEntryService, useValue: {} }],
    }).compile();

    controller = module.get<JournalEntryController>(JournalEntryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 2: migrated onto 'finance.journal_entries.*'. Notably,
  // create/submit/reverse were all previously the SAME legacy string
  // ('finance.accounting.create') but map to three DIFFERENT granular
  // actions -- confirming this controller's full entry lifecycle (submit,
  // approve, reverse) needed its own resource, not just a straight rename.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('GET /accounting/journal-entries requires finance.journal_entries.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findAll)).toEqual(['finance.journal_entries.read']);
    });
    it('GET /accounting/journal-entries/:id requires finance.journal_entries.read', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.findById)).toEqual(['finance.journal_entries.read']);
    });
    it('POST /accounting/journal-entries requires finance.journal_entries.create', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.create)).toEqual(['finance.journal_entries.create']);
    });
    it('PATCH /accounting/journal-entries/:id/draft requires finance.journal_entries.update', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.updateDraft)).toEqual(['finance.journal_entries.update']);
    });
    it('POST /accounting/journal-entries/:id/submit requires finance.journal_entries.submit', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.submit)).toEqual(['finance.journal_entries.submit']);
    });
    it('POST /accounting/journal-entries/:id/approve requires finance.journal_entries.approve', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.approve)).toEqual(['finance.journal_entries.approve']);
    });
    it('POST /accounting/journal-entries/:id/reverse requires finance.journal_entries.reverse', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.reverse)).toEqual(['finance.journal_entries.reverse']);
    });
  });
});
