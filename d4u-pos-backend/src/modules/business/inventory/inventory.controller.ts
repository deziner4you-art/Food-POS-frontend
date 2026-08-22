import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import { RequirePermissions, CurrentUser } from '../../../common/decorators';
import { validateTenantAccess } from '../../../common/utils/tenant.util';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  SyncOfflineDto,
  RecordPurchaseDto,
} from './dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermissions('inventory.create')
  @Post('sync-offline')
  async syncOffline(
    @CurrentUser() user: any,
    @Body() body: SyncOfflineDto
  ) {
    validateTenantAccess(user, body.store_id);
    return this.inventoryService.syncOfflineTransactions(
      body.store_id,
      body.transactions,
    );
  }

  @RequirePermissions('inventory.view')
  @Get('red-alerts/:store_id')
  async getNegativeInventory(
    @CurrentUser() user: any,
    @Param('store_id', ParseIntPipe) storeId: number
  ) {
    validateTenantAccess(user, storeId);
    return this.inventoryService.getNegativeInventory(storeId);
  }

  @RequirePermissions('inventory.view')
  @Get('low-stock/:store_id')
  async getLowStockItems(
    @CurrentUser() user: any,
    @Param('store_id', ParseIntPipe) storeId: number
  ) {
    validateTenantAccess(user, storeId);
    return this.inventoryService.getLowStockItems(storeId);
  }

  // --- CRUD for Inventory Items ---
  // Task #2R-B1: migrated off the legacy 2-segment 'inventory.*' strings onto
  // the real 'inventory.products.*' catalog permissions (#2R-A confirmed these
  // already exist and are already granted to Inventory Manager/Branch Manager).
  // Straight swap, not additive -- 'inventory.*' was never in the posPermissions
  // bridge, so nobody had access via any path except Super Admin before this;
  // this is a pure widening (Inventory Manager/Branch Manager gain access),
  // never a narrowing.
  @RequirePermissions('inventory.products.read')
  @Get('items/:store_id')
  async getInventoryItems(
    @CurrentUser() user: any,
    @Param('store_id', ParseIntPipe) storeId: number
  ) {
    validateTenantAccess(user, storeId);
    return this.inventoryService.getInventoryItems(storeId);
  }

  @RequirePermissions('inventory.products.read')
  @Get('item/:id')
  async getInventoryItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (item) validateTenantAccess(user, item.store_id);
    return item;
  }

  @RequirePermissions('inventory.products.create')
  @Post('items')
  async createInventoryItem(
    @CurrentUser() user: any,
    @Body() body: CreateInventoryDto
  ) {
    validateTenantAccess(user, body.store_id);
    return this.inventoryService.createInventoryItem(body);
  }

  @RequirePermissions('inventory.products.update')
  @Patch('items/:id')
  async updateInventoryItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInventoryDto,
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (item) validateTenantAccess(user, item.store_id);
    return this.inventoryService.updateInventoryItem(id, body);
  }

  @RequirePermissions('inventory.products.delete')
  @Delete('items/:id')
  async deleteInventoryItem(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (item) validateTenantAccess(user, item.store_id);
    return this.inventoryService.deleteInventoryItem(id);
  }

  @RequirePermissions('inventory.create')
  @Post('purchase')
  async recordPurchase(
    @CurrentUser() user: any,
    @Body() body: RecordPurchaseDto
  ) {
    validateTenantAccess(user, body.store_id);
    return this.inventoryService.recordPurchase(
      body.store_id,
      body.inventory_id,
      body.quantity,
      body.total_cost,
    );
  }

  @RequirePermissions('inventory.create')
  @Post('import-excel')
  async importExcel() {
    return this.inventoryService.importExcelData();
  }

  @RequirePermissions('inventory.update')
  @Post('adjust')
  async adjustStock(
    @CurrentUser() user: any,
    @Body() body: { inventory_id: number; operation: 'ADD' | 'SUBTRACT'; amount: number; reason: string },
  ) {
    return this.inventoryService.adjustStock({
      ...body,
      changed_by: user?.sub,
    });
  }

  @RequirePermissions('inventory.view')
  @Get('items/:id/history')
  async getItemHistory(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.inventoryService.getItemHistory(id);
  }
}
