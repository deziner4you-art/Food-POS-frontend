import { Controller, Post, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { PostingEngineService } from '../services/posting-engine.service';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/posting')
export class PostingController {
  constructor(private readonly service: PostingEngineService) {}

  @Post('manual/:journalEntryId')
  async postManualEntry(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('journalEntryId', ParseIntPipe) journalEntryId: number,
  ) {
    return this.service.postManualEntry(store_id, journalEntryId);
  }
}
