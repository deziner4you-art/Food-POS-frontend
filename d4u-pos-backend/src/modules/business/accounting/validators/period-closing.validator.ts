import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PeriodClosingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validatePeriodExists(periodId: number) {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new BadRequestException('Accounting period not found.');
    return period;
  }
}
