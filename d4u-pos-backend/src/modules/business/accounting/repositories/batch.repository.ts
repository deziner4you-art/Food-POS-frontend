import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(data: any) {
    return this.prisma.inventoryBatch.create({ data });
  }

  async findByBatchNumber(storeId: number, productId: number, batchNumber: string, warehouseId?: number) {
    const where: any = { store_id: storeId, product_id: productId, batch_number: batchNumber };
    if (warehouseId) where.warehouse_id = warehouseId;
    return this.prisma.inventoryBatch.findUnique({ where: { store_id_warehouse_id_product_id_batch_number: where } });
  }

  async getBatch(id: number) {
    return this.prisma.inventoryBatch.findUnique({ where: { id } });
  }

  async getAvailableBatches(storeId: number, productId: number, warehouseId?: number) {
    const where: any = { store_id: storeId, product_id: productId, status: 'ACTIVE', available_quantity: { gt: 0 } };
    if (warehouseId) where.warehouse_id = warehouseId;
    
    return this.prisma.inventoryBatch.findMany({ where });
  }

  async updateQuantities(batchId: number, data: any) {
    return this.prisma.inventoryBatch.update({ where: { id: batchId }, data });
  }

  async recordMovement(data: any) {
    return this.prisma.batchMovement.create({ data });
  }

  async createReservation(data: any) {
    return this.prisma.batchReservation.create({ data });
  }

  async updateBatchStatus(id: number, status: string) {
    return this.prisma.inventoryBatch.update({ where: { id }, data: { status } });
  }
}
