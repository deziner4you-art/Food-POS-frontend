import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

@Injectable()
export class InventoryReservationValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: InventoryLedgerService,
  ) {}

  async validateNewReservation(reservationNumber: string, expiryDate?: Date) {
    const existing = await this.prisma.inventoryReservation.findUnique({
      where: { reservation_number: reservationNumber }
    });

    if (existing) {
      throw new BadRequestException(`Duplicate reservation number (${reservationNumber}) prohibited.`);
    }

    if (expiryDate && new Date(expiryDate) <= new Date()) {
      throw new BadRequestException('Reservation expiry date must be in the future.');
    }
  }

  async validateReservationLine(storeId: number, productId: number, quantity: number, warehouseId?: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Reserved quantity must be positive.');
    }

    const balanceResult = await this.ledgerService.getCurrentBalance(storeId, productId);
    
    // Check if available balance (minus existing reservations) covers requested quantity
    const reservedSum = await this.prisma.inventoryReservationLine.aggregate({
      _sum: { available_balance: true },
      where: { product_id: productId, reservation: { store_id: storeId, warehouse_id: warehouseId, status: { in: ['RESERVED', 'PARTIALLY_CONSUMED'] } } }
    });

    const activeReservations = reservedSum._sum.available_balance || 0;
    const trueAvailable = balanceResult.current_balance - activeReservations;

    if (trueAvailable < quantity) {
      throw new BadRequestException(`Insufficient available stock for reservation. True Available: ${trueAvailable}, Requested: ${quantity}`);
    }
  }
}
