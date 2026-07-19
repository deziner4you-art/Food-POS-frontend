import { Controller, Get, Post, Put, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountingRulesService } from '../services/accounting-rules.service';
import { CreatePostingRuleDto } from '../dto/create-posting-rule.dto';
import { UpdatePostingRuleDto } from '../dto/update-posting-rule.dto';

@Controller('accounting/rules')
export class AccountingRulesController {
  constructor(private readonly service: AccountingRulesService) {}

  @RequirePermissions('finance.accounting.create')
  @Post()
  async createRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreatePostingRuleDto,
  ) {
    return this.service.createRule(store_id, dto);
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id')
  async updateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostingRuleDto,
  ) {
    return this.service.updateRule(store_id, id, dto);
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id/activate')
  async activateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.activateRule(store_id, id);
  }

  @RequirePermissions('finance.accounting.update')
  @Patch(':id/deactivate')
  async deactivateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deactivateRule(store_id, id);
  }

  @RequirePermissions('finance.accounting.view')
  @Get(':id')
  async getRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getRule(store_id, id);
  }

  @RequirePermissions('finance.accounting.view')
  @Get()
  async listRules(
    @Query('store_id', ParseIntPipe) store_id: number,
  ) {
    return this.service.getRules(store_id);
  }
}
