import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { RequirePermissions, Public } from '../../../common/decorators';
import { CategoryGroupService } from './category-group.service';
import {
  CreateCategoryGroupDto,
  UpdateCategoryGroupDto,
  ReorderCategoryGroupsDto,
  AssignCategoryGroupBranchesDto,
  AssignCategoryGroupChannelsDto,
} from './dto';

@Controller('catalog/category-groups')
export class CategoryGroupController {
  constructor(private readonly service: CategoryGroupService) {}

  @RequirePermissions('catalog.category_group.view')
  @Get()
  list(
    @Query('menu_id') menu_id?: string,
    @Query('store_id') store_id?: string,
    @Query('include_deleted') include_deleted?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_dir') sort_dir?: string,
  ) {
    return this.service.list({
      menu_id: menu_id ? Number(menu_id) : undefined,
      store_id: store_id ? Number(store_id) : undefined,
      include_deleted: include_deleted === 'true',
      sort_by,
      sort_dir,
    });
  }

  @RequirePermissions('catalog.category_group.view')
  @Get(':id')
  details(@Param('id') id: string) {
    return this.service.details(Number(id));
  }

  @RequirePermissions('catalog.category_group.create')
  @Post()
  create(@Body() body: CreateCategoryGroupDto) {
    console.log(`[NEW CATEGORY GROUP] ${body.name} (menu #${body.menu_id})`);
    return this.service.create(body);
  }

  @RequirePermissions('catalog.category_group.update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateCategoryGroupDto) {
    console.log(`[UPDATE CATEGORY GROUP] #${id}`);
    return this.service.update(Number(id), body);
  }

  @RequirePermissions('catalog.category_group.update')
  @Post('reorder')
  reorder(@Body() body: ReorderCategoryGroupsDto) {
    console.log(`[REORDER CATEGORY GROUPS] ${body.items.length} item(s)`);
    return this.service.reorder(body);
  }

  @RequirePermissions('catalog.category_group.update')
  @Post(':id/branches')
  assignBranches(@Param('id') id: string, @Body() body: AssignCategoryGroupBranchesDto) {
    console.log(`[CATEGORY GROUP BRANCHES] #${id} -> [${body.store_ids.join(', ')}]`);
    return this.service.assignBranches(Number(id), body);
  }

  @RequirePermissions('catalog.category_group.update')
  @Post(':id/channels')
  assignChannels(@Param('id') id: string, @Body() body: AssignCategoryGroupChannelsDto) {
    console.log(`[CATEGORY GROUP CHANNELS] #${id}`);
    return this.service.assignChannels(Number(id), body);
  }

  @RequirePermissions('catalog.category_group.delete')
  @Delete(':id')
  softDelete(@Param('id') id: string, @Query('deleted_by') deleted_by?: string) {
    console.log(`[DELETE CATEGORY GROUP] #${id}`);
    return this.service.softDelete(Number(id), deleted_by ? Number(deleted_by) : undefined);
  }

  @RequirePermissions('catalog.category_group.restore')
  @Post(':id/restore')
  restore(@Param('id') id: string, @Query('restored_by') restored_by?: string) {
    console.log(`[RESTORE CATEGORY GROUP] #${id}`);
    return this.service.restore(Number(id), restored_by ? Number(restored_by) : undefined);
  }

  // -------------------------------------------------------------
  // NESTED HIERARCHY — Menu Collection -> Category Group -> Category -> Product
  // -------------------------------------------------------------
  // Task #2R-B1: 'catalog.view' kept alongside the real 'catalog.category_group.view'
  // grant (additive OR, same pattern as #2Q-B2) -- a straight swap would drop
  // bridge-based access for Cashier/Manager/Business Admin/Business Owner/Branch
  // Owner, none of which hold catalog.category_group.view as a real grant.
  @RequirePermissions('catalog.view', 'catalog.category_group.view')
  @Get('hierarchy/menu/:menu_id')
  getMenuHierarchy(@Param('menu_id') menu_id: string) {
    return this.service.getMenuHierarchy(Number(menu_id));
  }

  // POS/Website/Waiter/QR/Kiosk consumption — public like the existing /catalog/sync/:store_id endpoint.
  // ?tab=all_items|discounted and ?category_group_id=X are mutually-exclusive navigation filters (Sprint 28.8A).
  @Public()
  @Get('hierarchy/store/:store_id')
  getStoreHierarchy(
    @Param('store_id') store_id: string,
    @Query('channel') channel?: string,
    @Query('tab') tab?: string,
    @Query('category_group_id') category_group_id?: string,
  ) {
    return this.service.getStoreHierarchy(Number(store_id), {
      channel,
      tab,
      category_group_id: category_group_id ? Number(category_group_id) : undefined,
    });
  }
}
