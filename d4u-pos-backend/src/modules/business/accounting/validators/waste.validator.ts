import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class WasteValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService
  ) {}

  async validateNewSession(storeId: number, referenceNumber: string) {
    const existing = await this.prisma.wasteSession.findFirst({
      where: { store_id: storeId, reference_number: referenceNumber }
    });
    if (existing) {
      throw new BadRequestException(`Duplicate waste reference (${referenceNumber}) prohibited.`);
    }
  }

  async validateWasteLine(storeId: number, productId: number, quantity: number, warehouseId?: number, batchNumber?: string) {
    if (quantity <= 0) {
      throw new BadRequestException('Waste quantity must be positive.');
    }

    const balanceResult = await this.ledgerService.getCurrentBalance(storeId, productId); // Simplified
    
    if (balanceResult.current_balance < quantity) {
      throw new BadRequestException(`Insufficient stock for waste recording on Product ${productId}. Available: ${balanceResult.current_balance}, Waste Requested: ${quantity}`);
    }
  }

  async validateApproval(sessionId: number) {
    const session = await this.prisma.wasteSession.findUnique({ where: { id: sessionId }, include: { lines: true } });
    if (!session) throw new BadRequestException('Waste session not found.');
    if (session.status !== 'REVIEW' && session.status !== 'DRAFT') {
      throw new BadRequestException(`Waste session cannot be approved in status: ${session.status}`);
    }
    if (session.lines.length === 0) {
      throw new BadRequestException('Cannot approve an empty waste session.');
    }
    return session;
  }
}
