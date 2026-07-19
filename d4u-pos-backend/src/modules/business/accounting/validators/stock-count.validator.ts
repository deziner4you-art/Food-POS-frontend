import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class StockCountValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateActiveSession(storeId: number, warehouseId?: number) {
    // Ensure no other active counting session is open for the same location
    const active = await this.prisma.stockCountSession.findFirst({
      where: {
        store_id: storeId,
        warehouse_id: warehouseId,
        status: { in: ['DRAFT', 'COUNTING', 'REVIEW'] }
      }
    });

    if (active) {
      throw new BadRequestException(`An active stock count session (${active.id}) already exists for this location.`);
    }
  }

  validatePhysicalCount(quantity: number) {
    if (quantity < 0) {
      throw new BadRequestException('Physical count quantity cannot be negative.');
    }
  }

  async validateApproval(sessionId: number) {
    const session = await this.prisma.stockCountSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new BadRequestException('Session not found.');
    if (session.status !== 'REVIEW') {
      throw new BadRequestException(`Session cannot be approved in status: ${session.status}`);
    }
  }
}
