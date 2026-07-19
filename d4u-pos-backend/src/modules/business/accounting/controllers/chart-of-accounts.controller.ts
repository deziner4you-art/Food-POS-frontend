import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { ChartOfAccountsService } from '../services/chart-of-accounts.service';
import { CreateAccountGroupDto } from '../dto/create-account-group.dto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { MoveAccountDto } from '../dto/move-account.dto';

@RequirePermissions('finance.accounting.manage')
@Controller('accounting/coa')
export class ChartOfAccountsController {
  constructor(private readonly coaService: ChartOfAccountsService) {}

  @Get('tree')
  async getTree(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.coaService.getTree(store_id);
  }

  @Get('search')
  async search(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Query('q') query: string,
  ) {
    return this.coaService.search(store_id, query || '');
  }

  @Post('groups')
  async createGroup(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountGroupDto,
  ) {
    return this.coaService.createGroup(store_id, dto);
  }

  @Post('accounts')
  async createAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountDto,
  ) {
    return this.coaService.createAccount(store_id, dto);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.coaService.updateAccount(store_id, id, dto);
  }

  @Patch('accounts/:id/disable')
  async disableAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coaService.disableAccount(store_id, id);
  }

  @Patch('accounts/:id/move')
  async moveAccount(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveAccountDto,
  ) {
    return this.coaService.moveAccount(store_id, id, dto);
  }

  @Patch('groups/:id/move')
  async moveGroup(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveAccountDto,
  ) {
    return this.coaService.moveGroup(store_id, id, dto);
  }
}
