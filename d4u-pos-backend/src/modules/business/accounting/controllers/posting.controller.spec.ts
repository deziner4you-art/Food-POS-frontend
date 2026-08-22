import { Test, TestingModule } from '@nestjs/testing';
import { PostingController } from './posting.controller';
import { PostingEngineService } from '../services/posting-engine.service';
import { PERMISSIONS_KEY } from '../../../../common/decorators/permissions.decorator';

describe('PostingController', () => {
  let controller: PostingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostingController],
      providers: [{ provide: PostingEngineService, useValue: {} }],
    }).compile();

    controller = module.get<PostingController>(PostingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Task #2R-C4 batch 2: manual GL posting is inherently a journal-entry
  // action, so it was folded into 'finance.journal_entries.post' rather
  // than getting its own resource -- matching the 'post' action name
  // already present (but previously unused by any decorator) on
  // finance.journals in the original catalog.
  describe('@RequirePermissions metadata (Task #2R-C4)', () => {
    it('POST /accounting/posting/manual/:journalEntryId requires finance.journal_entries.post', () => {
      expect(Reflect.getMetadata(PERMISSIONS_KEY, controller.postManualEntry)).toEqual(['finance.journal_entries.post']);
    });
  });
});
