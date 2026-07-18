import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as os from 'os';

import { AppGateway } from '../../../app.gateway';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
  ) {}

  // 1. Event Sourcing Sync (Offline-First support)
  // Receives an array of operations (+/-) from the Local POS when internet restores
  async syncOfflineTransactions(store_id: number, transactions: any[]) {
    // We use a transaction to guarantee data integrity across all synced items
    return this.prisma.$transaction(async (tx) => {
      let totalSynced = 0;
      for (const t of transactions) {
        // Log the append-only ledger entry
        await tx.inventoryTransactionLog.create({
          data: {
            inventory_id: t.inventory_id,
            operation: t.operation, // 'ADD' or 'SUBTRACT'
            amount: t.amount,
            reason: t.reason || 'Offline Sync',
            changed_by: t.changed_by
          }
        });

        // Calculate the true balance increment/decrement safely (Atomic Operations)
        const modifier = t.operation === 'SUBTRACT' ? -t.amount : t.amount;
        
        await tx.inventoryItem.update({
          where: { id: t.inventory_id },
          data: {
            quantity: { increment: modifier } // Atomic update prevents overwrites
          }
        });
        totalSynced++;
      }
      return { status: 'success', synced: totalSynced };
    });
  }

  // 2. Negative Inventory / Soft Block trigger
  // Used by branch manager to view items that went into negative during rush hours
  async getNegativeInventory(store_id: number) {
    return this.prisma.inventoryItem.findMany({
      where: {
        store_id,
        quantity: { lt: 0 } // Red Alert items
      }
    });
  }

  // 3. Deduct Inventory for Order & Emit Soft Block Alert
  async deductForOrder(orderId: number) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { product: { include: { recipeItems: true } } } } }
      }) as any; // Cast as any to bypass strict Prisma relation typings temporarily

      if (!order) return;

      const storeId = order.store_id;

      for (const item of order.items) {
        if (!item.product || !item.product.recipeItems) continue;

        for (const recipe of item.product.recipeItems) {
          const deductionAmount = recipe.quantity_needed * item.quantity;
          
          // Atomic Decrement
          const updatedItem = await this.prisma.inventoryItem.update({
            where: { id: recipe.inventory_id },
            data: { quantity: { decrement: deductionAmount } }
          });

          // Log transaction
          await this.prisma.inventoryTransactionLog.create({
            data: {
              inventory_id: recipe.inventory_id,
              operation: 'SUBTRACT',
              amount: deductionAmount,
              reason: `Auto-deduct for Order #${order.id}`,
              changed_by: order.created_by || 1
            }
          });

          // Trigger Soft Block Alert if it goes into negative
          if (updatedItem.quantity < 0) {
            this.gateway.server.emit('negative_inventory_alert', {
              store_id: storeId,
              inventory_id: updatedItem.id,
              name: updatedItem.name,
              balance: updatedItem.quantity
            });
          }
        }
      }
    } catch (e) {
      console.error(`[InventoryService] Error deducting for order ${orderId}:`, e);
    }
  }

  // --- CRUD for Inventory Items ---
  async getInventoryItems(store_id: number) {
    return this.prisma.inventoryItem.findMany({
      where: { store_id },
      orderBy: { id: 'desc' }
    });
  }

  async getInventoryItem(id: number) {
    return this.prisma.inventoryItem.findUnique({
      where: { id },
      include: { recipes: true, transactions: true }
    });
  }

  async createInventoryItem(data: { store_id: number; name: string; quantity: number; unit: string; reorder_level?: number; unit_price?: number }) {
    return this.prisma.inventoryItem.create({
      data: {
        store_id: data.store_id,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        reorder_level: data.reorder_level || 0,
        unit_price: data.unit_price || 0,
      }
    });
  }

  async recordPurchase(store_id: number, inventory_id: number, quantity_bought: number, total_cost: number) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({ where: { id: inventory_id } });
      if (!item) throw new Error('Inventory item not found');

      // Current stock value
      const currentQuantity = item.quantity > 0 ? item.quantity : 0;
      const currentTotalValue = currentQuantity * (item.unit_price || 0);

      // New stock value
      const newTotalValue = currentTotalValue + total_cost;
      const newTotalQuantity = currentQuantity + quantity_bought;

      // Weighted Average Unit Price
      const newUnitPrice = newTotalValue / newTotalQuantity;

      // Update Item
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventory_id },
        data: {
          quantity: { increment: quantity_bought },
          unit_price: newUnitPrice
        }
      });

      // Log transaction
      await tx.inventoryTransactionLog.create({
        data: {
          inventory_id,
          operation: 'ADD',
          amount: quantity_bought,
          reason: `Purchased Stock (Cost: ${total_cost}, Avg: ${newUnitPrice.toFixed(2)})`,
          changed_by: 1 // Default user for now
        }
      });

      return { success: true, updatedItem };
    });
  }

  // --- EXCEL IMPORT LOGIC ---
  async importExcelData() {
    // Look in the User's Downloads directory for the specific file
    const downloadsPath = path.join(os.homedir(), 'Downloads');
    const filePath = path.join(downloadsPath, 'Final NEW COSTING SHEET.xls');
    
    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (e) {
      throw new NotFoundException(`Excel file not found at ${filePath}. Please ensure the file exists.`);
    }

    const uniqueItems = new Map<string, number>();

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      
      for (const row of data as any[]) {
        if (!Array.isArray(row)) continue;
        
        for (let i = 0; i < row.length; i++) {
          if (typeof row[i] === 'string' && row[i].trim() && 
              !row[i].toUpperCase().includes('TOTAL') && 
              !row[i].toUpperCase().includes('COST') && 
              !row[i].toUpperCase().includes('SALE')) {
             
             if (typeof row[i+1] === 'number' && typeof row[i+2] === 'number') {
               const itemName = row[i].trim().replace(/\s+/g, ' '); // normalize spaces
               const unitPrice = row[i+2];
               
               // Exclude headers
               if (['ITEM', 'QTY', 'PRICE', 'DESCRIPTION', 'SR.NO', 'ITEM NAME'].includes(itemName.toUpperCase())) continue;
               
               if (!uniqueItems.has(itemName)) {
                 uniqueItems.set(itemName, unitPrice);
               }
               break;
             }
          }
        }
      }
    }

    let importedCount = 0;
    
    // Default store_id = 1 (Head Office / Main Branch for global inventory)
    const store_id = 1;

    for (const [name, price] of uniqueItems.entries()) {
      // Check if it exists
      const existing = await this.prisma.inventoryItem.findFirst({
        where: { store_id, name: { equals: name, mode: 'insensitive' } }
      });

      if (!existing) {
        await this.prisma.inventoryItem.create({
          data: {
            store_id,
            name,
            quantity: 0,
            unit: 'unit', // default unit
            reorder_level: 0,
            unit_price: price
          }
        });
        importedCount++;
      } else {
        // Optionally update the unit price if it already exists
        await this.prisma.inventoryItem.update({
          where: { id: existing.id },
          data: { unit_price: price }
        });
      }
    }

    return { 
      success: true, 
      message: `Extracted ${uniqueItems.size} unique raw materials. Imported ${importedCount} new items to DB.`,
      itemsExtracted: uniqueItems.size
    };
  }

  async updateInventoryItem(id: number, data: { name?: string; quantity?: number; unit?: string; reorder_level?: number; unit_price?: number }) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data,
    });
  }

  async deleteInventoryItem(id: number) {
    return this.prisma.inventoryItem.delete({
      where: { id },
    });
  }
}
