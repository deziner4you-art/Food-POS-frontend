import { Injectable, BadRequestException } from '@nestjs/common';
import { RecordMovementDto } from '../interfaces/inventory-movement.interface';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryLedgerValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateMovement(dto: RecordMovementDto) {
    if (dto.quantity_in < 0 || dto.quantity_out < 0) {
      throw new BadRequestException('Quantities must be positive. Use quantity_in or quantity_out to reflect direction.');
    }

    if (dto.quantity_in === 0 && dto.quantity_out === 0) {
      throw new BadRequestException('Movement must specify either quantity_in or quantity_out.');
    }

    if (dto.quantity_in > 0 && dto.quantity_out > 0) {
      throw new BadRequestException('Movement cannot have both quantity_in and quantity_out simultaneously.');
    }

    const item = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.product_id }
    });

    if (!item) {
      throw new BadRequestException(`Inventory item ${dto.product_id} not found.`);
    }
  }
}
