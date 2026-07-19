import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateBatchDto } from '../interfaces/batch.interface';

@Injectable()
export class BatchValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateCreateBatch(dto: CreateBatchDto) {
    if (dto.manufacturing_date && dto.expiry_date) {
      if (new Date(dto.expiry_date) <= new Date(dto.manufacturing_date)) {
        throw new BadRequestException('Expiry date must be after manufacturing date.');
      }
    }

    const where: any = { store_id: dto.store_id, product_id: dto.product_id, batch_number: dto.batch_number };
    if (dto.warehouse_id) where.warehouse_id = dto.warehouse_id;

    const existing = await this.prisma.inventoryBatch.findUnique({
      where: { store_id_warehouse_id_product_id_batch_number: where }
    });

    if (existing) {
      throw new BadRequestException(`Batch number ${dto.batch_number} already exists for this product in this location.`);
    }
  }

  async validateConsumption(batchId: number, quantityToConsume: number) {
    const batch = await this.prisma.inventoryBatch.findUnique({ where: { id: batchId } });
    if (!batch) throw new BadRequestException('Batch not found.');

    if (batch.status === 'EXPIRED') {
      throw new BadRequestException('Cannot consume expired batch.');
    }

    if (quantityToConsume > batch.available_quantity) {
      throw new BadRequestException(`Cannot exceed available quantity. Requested: ${quantityToConsume}, Available: ${batch.available_quantity}`);
    }

    return batch;
  }
}
