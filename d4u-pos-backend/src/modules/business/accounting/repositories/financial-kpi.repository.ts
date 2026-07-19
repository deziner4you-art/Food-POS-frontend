import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FinancialKpiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  getPrisma() {
    return this.prisma;
  }
}
