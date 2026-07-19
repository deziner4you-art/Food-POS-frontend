import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class WasteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(data: any) {
    return this.prisma.wasteSession.create({ data });
  }

  async findByReference(storeId: number, referenceNumber: string) {
    return this.prisma.wasteSession.findFirst({
      where: { store_id: storeId, reference_number: referenceNumber }
    });
  }

  async getSession(id: number) {
    return this.prisma.wasteSession.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async addLine(data: any) {
    return this.prisma.wasteLine.create({ data });
  }

  async updateSessionStatus(id: number, status: string, approvedBy?: number) {
    const data: any = { status };
    if (approvedBy) data.approved_by = approvedBy;

    return this.prisma.wasteSession.update({
      where: { id },
      data,
    });
  }
}
