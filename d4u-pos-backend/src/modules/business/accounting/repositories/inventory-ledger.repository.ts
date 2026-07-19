import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryLedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMovement(data: any) {
    return this.prisma.inventoryMovement.create({ data });
  }

  async getLatestBalance(storeId: number, productId: number, warehouseId?: number, batchNumber?: string) {
    const whereClause: any = { store_id: storeId, product_id: productId };
    if (warehouseId) whereClause.warehouse_id = warehouseId;
    if (batchNumber) whereClause.batch_number = batchNumber;

    const latest = await this.prisma.inventoryMovement.findFirst({
      where: whereClause,
      orderBy: [
        { transaction_date: 'desc' },
        { id: 'desc' }
      ]
    });

    return latest ? latest.balance_after : 0;
  }

  async getMovements(storeId: number, productId: number) {
    return this.prisma.inventoryMovement.findMany({
      where: { store_id: storeId, product_id: productId },
      orderBy: [
        { transaction_date: 'asc' },
        { id: 'asc' }
      ]
    });
  }
}
