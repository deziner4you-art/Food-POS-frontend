import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class WarehouseTransferRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTransfer(data: any) {
    return this.prisma.warehouseTransfer.create({ data });
  }

  async findByTransferNumber(transferNumber: string) {
    return this.prisma.warehouseTransfer.findUnique({
      where: { transfer_number: transferNumber }
    });
  }

  async getTransfer(id: number) {
    return this.prisma.warehouseTransfer.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async addLine(data: any) {
    return this.prisma.warehouseTransferLine.create({ data });
  }

  async updateTransferStatus(id: number, status: string, approvedBy?: number) {
    const data: any = { status };
    if (approvedBy) data.approved_by = approvedBy;
    return this.prisma.warehouseTransfer.update({ where: { id }, data });
  }

  async updateLineQuantities(lineId: number, data: any) {
    return this.prisma.warehouseTransferLine.update({ where: { id: lineId }, data });
  }
}
