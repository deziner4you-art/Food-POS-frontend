import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { AvailabilityService } from './availability.service';

@Controller('catalog/availability-rules')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @RequirePermissions('catalog.view')
  @Get()
  getRules(@Query('store_id') store_id: string, @Query('sort_by') sort_by?: string, @Query('sort_dir') sort_dir?: string) {
    return this.service.getAvailabilityRules(Number(store_id), sort_by, sort_dir);
  }

  @RequirePermissions('catalog.view')
  @Get(':id')
  getRule(@Param('id', ParseIntPipe) id: number) {
    return this.service.getAvailabilityRule(id);
  }

  @RequirePermissions('catalog.create')
  @Post()
  createRule(@Body() body: any) {
    return this.service.createAvailabilityRule(body);
  }

  @RequirePermissions('catalog.update')
  @Patch(':id')
  updateRule(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateAvailabilityRule(id, body);
  }

  @RequirePermissions('catalog.delete')
  @Delete(':id')
  deleteRule(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteAvailabilityRule(id);
  }
}
