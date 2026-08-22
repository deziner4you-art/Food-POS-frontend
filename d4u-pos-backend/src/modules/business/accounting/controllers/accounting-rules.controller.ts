import { Controller, Get, Post, Put, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { AccountingRulesService } from '../services/accounting-rules.service';
import { CreatePostingRuleDto } from '../dto/create-posting-rule.dto';
import { UpdatePostingRuleDto } from '../dto/update-posting-rule.dto';

@Controller('accounting/rules')
export class AccountingRulesController {
  constructor(private readonly service: AccountingRulesService) {}

  // Task #2R-E1: migrated off the legacy coarse 'finance.accounting.*' onto
  // 'finance.system_accounts.*' -- #2R-E found this posting-rules-engine
  // config API shares the same conceptual domain and service dependency
  // (AccountingRulesService -> SystemAccountMappingService) as
  // system-account-mapping.controller.ts, already migrated in #2R-C4.
  // Straight swap, not additive -- #2R-D already removed
  // finance.accounting.create/view from the POS compatibility bridge, so
  // this was already Super-Admin-only; Finance Manager already holds all
  // three system_accounts actions, Accountant does not (matching the
  // sibling domain's exclusion).
  @RequirePermissions('finance.system_accounts.create')
  @Post()
  async createRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreatePostingRuleDto,
  ) {
    return this.service.createRule(store_id, dto);
  }

  @RequirePermissions('finance.system_accounts.update')
  @Patch(':id')
  async updateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostingRuleDto,
  ) {
    return this.service.updateRule(store_id, id, dto);
  }

  @RequirePermissions('finance.system_accounts.update')
  @Patch(':id/activate')
  async activateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.activateRule(store_id, id);
  }

  @RequirePermissions('finance.system_accounts.update')
  @Patch(':id/deactivate')
  async deactivateRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.deactivateRule(store_id, id);
  }

  @RequirePermissions('finance.system_accounts.read')
  @Get(':id')
  async getRule(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.getRule(store_id, id);
  }

  @RequirePermissions('finance.system_accounts.read')
  @Get()
  async listRules(
    @Query('store_id', ParseIntPipe) store_id: number,
  ) {
    return this.service.getRules(store_id);
  }
}
