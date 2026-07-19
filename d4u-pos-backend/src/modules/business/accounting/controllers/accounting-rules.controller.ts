import { Controller, Get, Post, Put, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { AccountingRulesService } from '../services/accounting-rules.service';
import { CreatePostingRuleDto } from '../dto/create-posting-rule.dto';
import { UpdatePostingRuleDto } from '../dto/update-posting-rule.dto';

@Controller('accounting/rules')
export class AccountingRulesController {
  constructor(private readonly service: AccountingRulesService) {}

  @Post()
  async createRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreatePostingRuleDto,
  ) {
    return this.service.createRule(store_id, dto);
  }

  @Patch(':id')
  async updateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostingRuleDto,
  ) {
    return this.service.updateRule(store_id, id, dto);
  }

  @Patch(':id/activate')
  async activateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.activateRule(store_id, id);
  }

  @Patch(':id/deactivate')
  async deactivateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deactivateRule(store_id, id);
  }

  @Get(':id')
  async getRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getRule(store_id, id);
  }

  @Get()
  async listRules(
    @Query('store_id', ParseIntPipe) store_id: number,
  ) {
    return this.service.getRules(store_id);
  }
}
