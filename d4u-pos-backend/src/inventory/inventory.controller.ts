import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('sync-offline')
  async syncOffline(@Body() body: { store_id: number, transactions: any[] }) {
    return this.inventoryService.syncOfflineTransactions(body.store_id, body.transactions);
  }

  @Get('red-alerts/:store_id')
  async getNegativeInventory(@Param('store_id', ParseIntPipe) storeId: number) {
    return this.inventoryService.getNegativeInventory(storeId);
  }
}
