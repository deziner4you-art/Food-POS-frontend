import { Controller, Post, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequireModule, RequirePermissions } from '../../../../common/decorators';
import { PostingEngineService } from '../services/posting-engine.service';

@Controller('accounting/posting')
@RequireModule('ACCOUNTING')
export class PostingController {
  constructor(private readonly service: PostingEngineService) {}

  @RequirePermissions('finance.journal_entries.post')
  @Post('manual/:journalEntryId')
  async postManualEntry(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('journalEntryId', ParseIntPipe) journalEntryId: number,
  ) {
    return this.service.postManualEntry(store_id, journalEntryId);
  }
}
