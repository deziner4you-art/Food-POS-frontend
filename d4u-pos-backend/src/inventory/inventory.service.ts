import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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
}
