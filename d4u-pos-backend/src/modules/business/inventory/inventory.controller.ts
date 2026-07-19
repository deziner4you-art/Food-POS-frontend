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
import { RequirePermissions } from '../../../common/decorators';
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
  async syncOffline(@Body() body: SyncOfflineDto) {
    return this.inventoryService.syncOfflineTransactions(
      body.store_id,
      body.transactions,
    );
  }

  @RequirePermissions('inventory.view')
  @Get('red-alerts/:store_id')
  async getNegativeInventory(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.inventoryService.getNegativeInventory(storeId);
  }

  // --- CRUD for Inventory Items ---
  @RequirePermissions('inventory.view')
  @Get('items/:store_id')
  async getInventoryItems(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.inventoryService.getInventoryItems(storeId);
  }

  @RequirePermissions('inventory.view')
  @Get('item/:id')
  async getInventoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getInventoryItem(id);
  }

  @RequirePermissions('inventory.create')
  @Post('items')
  async createInventoryItem(@Body() body: CreateInventoryDto) {
    return this.inventoryService.createInventoryItem(body);
  }

  @RequirePermissions('inventory.update')
  @Patch('items/:id')
  async updateInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventoryItem(id, body);
  }

  @RequirePermissions('inventory.delete')
  @Delete('items/:id')
  async deleteInventoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteInventoryItem(id);
  }

  @RequirePermissions('inventory.create')
  @Post('purchase')
  async recordPurchase(@Body() body: RecordPurchaseDto) {
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
}
