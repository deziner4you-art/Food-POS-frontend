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

  @Post('sync-offline')
  async syncOffline(@Body() body: SyncOfflineDto) {
    return this.inventoryService.syncOfflineTransactions(
      body.store_id,
      body.transactions,
    );
  }

  @Get('red-alerts/:store_id')
  async getNegativeInventory(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.inventoryService.getNegativeInventory(storeId);
  }

  // --- CRUD for Inventory Items ---
  @Get('items/:store_id')
  async getInventoryItems(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.inventoryService.getInventoryItems(storeId);
  }

  @Get('item/:id')
  async getInventoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.getInventoryItem(id);
  }

  @Post('items')
  async createInventoryItem(@Body() body: CreateInventoryDto) {
    return this.inventoryService.createInventoryItem(body);
  }

  @Patch('items/:id')
  async updateInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateInventoryItem(id, body);
  }

  @Delete('items/:id')
  async deleteInventoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteInventoryItem(id);
  }

  @Post('purchase')
  async recordPurchase(@Body() body: RecordPurchaseDto) {
    return this.inventoryService.recordPurchase(
      body.store_id,
      body.inventory_id,
      body.quantity,
      body.total_cost,
    );
  }

  @Post('import-excel')
  async importExcel() {
    return this.inventoryService.importExcelData();
  }
}
