import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { JournalService } from '../services/journal.service';
import { CreateJournalDto } from '../dto/create-journal.dto';
import { UpdateJournalDto } from '../dto/update-journal.dto';

@Controller('accounting/journals')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @RequirePermissions('finance.journals.read')
  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.journalService.findAll(store_id);
  }

  @RequirePermissions('finance.journals.read')
  @Get(':id')
  async findById(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journalService.findById(store_id, id);
  }

  @RequirePermissions('finance.journals.create')
  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateJournalDto,
  ) {
    return this.journalService.create(store_id, dto);
  }

  @RequirePermissions('finance.journals.update')
  @Patch(':id')
  async update(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJournalDto,
  ) {
    return this.journalService.update(store_id, id, dto);
  }

  @RequirePermissions('finance.journals.update')
  @Patch(':id/activate')
  async activate(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journalService.activate(store_id, id);
  }

  @RequirePermissions('finance.journals.update')
  @Patch(':id/deactivate')
  async deactivate(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.journalService.deactivate(store_id, id);
  }
}
