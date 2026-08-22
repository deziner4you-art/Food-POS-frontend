import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RequirePermissions } from '../../../../common/decorators';
import { SystemAccountMappingService } from '../services/system-account-mapping.service';
import { CreateSystemAccountMappingDto } from '../dto/create-system-account-mapping.dto';
import { UpdateSystemAccountMappingDto } from '../dto/update-system-account-mapping.dto';
import { SystemAccountType } from '../enums/system-account-type.enum';

@Controller('accounting/system-accounts')
export class SystemAccountMappingController {
  constructor(private readonly mappingService: SystemAccountMappingService) {}

  @RequirePermissions('finance.system_accounts.create')
  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateSystemAccountMappingDto,
  ) {
    return this.mappingService.createMapping(store_id, dto);
  }

  @RequirePermissions('finance.system_accounts.read')
  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.mappingService.findAll(store_id);
  }

  @RequirePermissions('finance.system_accounts.read')
  @Get('type/:type')
  async findByType(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('type') type: SystemAccountType,
  ) {
    return this.mappingService.findByType(store_id, type);
  }

  @RequirePermissions('finance.system_accounts.update')
  @Patch(':id')
  async update(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemAccountMappingDto,
  ) {
    return this.mappingService.updateMapping(id, store_id, dto);
  }
}
