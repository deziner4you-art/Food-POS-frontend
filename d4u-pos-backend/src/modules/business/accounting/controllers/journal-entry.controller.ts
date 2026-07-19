import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { ReverseJournalEntryDto } from '../dto/reverse-journal-entry.dto';
import { ApproveJournalEntryDto } from '../dto/approve-journal-entry.dto';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/journal-entries')
export class JournalEntryController {
  constructor(private readonly service: JournalEntryService) {}

  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.service.findAll(store_id);
  }

  @Get(':id')
  async findById(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findById(store_id, id);
  }

  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.service.create(store_id, dto);
  }

  @Patch(':id/draft')
  async updateDraft(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.service.updateDraft(store_id, id, dto);
  }

  @Post(':id/submit')
  async submit(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.submit(store_id, id);
  }

  @Post(':id/approve')
  async approve(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveJournalEntryDto,
  ) {
    return this.service.approve(store_id, id);
  }

  @Post(':id/reverse')
  async reverse(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReverseJournalEntryDto,
  ) {
    return this.service.reverse(store_id, id, dto);
  }
}
