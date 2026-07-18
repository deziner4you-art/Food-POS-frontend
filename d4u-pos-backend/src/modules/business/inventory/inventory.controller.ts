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

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('sync-offline')
  async syncOffline(@Body() body: { store_id: number; transactions: any[] }) {
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
  async createInventoryItem(
    @Body()
    body: {
      store_id: number;
      name: string;
      quantity: number;
      unit: string;
      reorder_level?: number;
      unit_price?: number;
    },
  ) {
    return this.inventoryService.createInventoryItem(body);
  }

  @Patch('items/:id')
  async updateInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      name?: string;
      quantity?: number;
      unit?: string;
      reorder_level?: number;
      unit_price?: number;
    },
  ) {
    return this.inventoryService.updateInventoryItem(id, body);
  }

  @Delete('items/:id')
  async deleteInventoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteInventoryItem(id);
  }

  @Post('purchase')
  async recordPurchase(
    @Body()
    body: {
      store_id: number;
      inventory_id: number;
      quantity: number;
      total_cost: number;
    },
  ) {
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
