import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class InventoryReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReservation(data: any) {
    return this.prisma.inventoryReservation.create({ data });
  }

  async getReservation(id: number) {
    return this.prisma.inventoryReservation.findUnique({
      where: { id },
      include: { lines: { include: { allocations: true } } }
    });
  }

  async updateReservationStatus(id: number, status: string) {
    return this.prisma.inventoryReservation.update({ where: { id }, data: { status } });
  }

  async addLine(data: any) {
    return this.prisma.inventoryReservationLine.create({ data });
  }

  async addAllocation(data: any) {
    return this.prisma.reservationAllocation.create({ data });
  }

  async updateLineQuantities(lineId: number, data: any) {
    return this.prisma.inventoryReservationLine.update({ where: { id: lineId }, data });
  }

  async updateAllocationStatus(allocationId: number, status: string) {
    return this.prisma.reservationAllocation.update({ where: { id: allocationId }, data: { status } });
  }
}
