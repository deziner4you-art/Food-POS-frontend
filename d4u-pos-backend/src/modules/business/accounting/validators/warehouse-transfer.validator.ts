import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateTransferRequestDto } from '../interfaces/warehouse-transfer.interface';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class WarehouseTransferValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  async validateNewTransfer(dto: CreateTransferRequestDto) {
    if (dto.source_store_id === dto.dest_store_id && dto.source_warehouse_id === dto.dest_warehouse_id) {
      throw new BadRequestException('Source and destination cannot be identical.');
    }

    const existing = await this.prisma.warehouseTransfer.findUnique({
      where: { transfer_number: dto.transfer_number }
    });

    if (existing) {
      throw new BadRequestException(`Duplicate transfer number (${dto.transfer_number}) prohibited.`);
    }
  }

  async validateTransferLine(sourceStoreId: number, productId: number, quantity: number, sourceWarehouseId?: number, batchId?: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Requested quantity must be positive.');
    }

    if (batchId) {
      const batch = await this.prisma.inventoryBatch.findUnique({ where: { id: batchId } });
      if (!batch) throw new BadRequestException('Batch not found.');
      if (batch.status === 'EXPIRED') throw new BadRequestException('Cannot transfer expired batch.');
      if (quantity > batch.available_quantity) throw new BadRequestException('Cannot exceed available batch quantity.');
    } else {
      const balanceResult = await this.ledgerService.getCurrentBalance(sourceStoreId, productId);
      if (balanceResult.current_balance < quantity) {
        throw new BadRequestException(`Insufficient stock for transfer. Available: ${balanceResult.current_balance}`);
      }
    }
  }

  async validateApproval(transferId: number) {
    const transfer = await this.prisma.warehouseTransfer.findUnique({ where: { id: transferId }, include: { lines: true } });
    if (!transfer) throw new BadRequestException('Transfer not found.');
    if (transfer.status !== 'PENDING_APPROVAL' && transfer.status !== 'DRAFT') {
      throw new BadRequestException(`Transfer cannot be approved in status: ${transfer.status}`);
    }
    if (transfer.lines.length === 0) throw new BadRequestException('Cannot approve an empty transfer.');
    return transfer;
  }
}
