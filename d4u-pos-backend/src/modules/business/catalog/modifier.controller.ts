import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../../common/decorators';
import { ModifierService } from './modifier.service';

@Controller('catalog/modifiers')
export class ModifierController {
  constructor(private readonly service: ModifierService) {}

  // ==========================================
  // Modifier Groups
  // ==========================================
  @RequirePermissions('catalog.view')
  @Get('groups')
  getGroups(@Query('store_id') store_id: string, @Query('sort_by') sort_by?: string, @Query('sort_dir') sort_dir?: string) {
    return this.service.getModifierGroups(Number(store_id), sort_by, sort_dir);
  }

  @RequirePermissions('catalog.view')
  @Get('groups/:id')
  getGroup(@Param('id', ParseIntPipe) id: number) {
    return this.service.getModifierGroup(id);
  }

  @RequirePermissions('catalog.create')
  @Post('groups')
  createGroup(@Body() body: any) {
    return this.service.createModifierGroup(body);
  }

  @RequirePermissions('catalog.update')
  @Patch('groups/:id')
  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateModifierGroup(id, body);
  }

  @RequirePermissions('catalog.delete')
  @Delete('groups/:id')
  deleteGroup(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteModifierGroup(id);
  }

  // ==========================================
  // Modifiers
  // ==========================================
  @RequirePermissions('catalog.create')
  @Post()
  createModifier(@Body() body: any) {
    return this.service.createModifier(body);
  }

  @RequirePermissions('catalog.update')
  @Patch(':id')
  updateModifier(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateModifier(id, body);
  }

  @RequirePermissions('catalog.delete')
  @Delete(':id')
  deleteModifier(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteModifier(id);
  }

  // ==========================================
  // Product Modifier Links
  // ==========================================
  @RequirePermissions('catalog.view')
  @Get('product/:product_id')
  getProductModifiers(@Param('product_id', ParseIntPipe) product_id: number) {
    return this.service.getProductModifiers(product_id);
  }

  @RequirePermissions('catalog.update')
  @Post('product/:product_id/groups/:group_id')
  linkGroup(
    @Param('product_id', ParseIntPipe) product_id: number,
    @Param('group_id', ParseIntPipe) group_id: number,
  ) {
    return this.service.linkGroupToProduct(product_id, group_id);
  }

  @RequirePermissions('catalog.update')
  @Delete('product/:product_id/groups/:group_id')
  unlinkGroup(
    @Param('product_id', ParseIntPipe) product_id: number,
    @Param('group_id', ParseIntPipe) group_id: number,
  ) {
    return this.service.unlinkGroupFromProduct(product_id, group_id);
  }
}
