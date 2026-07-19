import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { AccountingRequest } from '../interfaces/accounting-request.interface';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class AccountingIntegrationValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validateRequest(req: AccountingRequest) {
    if (!req.store_id || !req.business_event || req.amount === undefined || req.amount === null) {
      throw new BadRequestException('Invalid request payload. Missing core fields.');
    }

    const store = await this.prisma.store.findUnique({ where: { id: req.store_id } });
    if (!store) {
      throw new BadRequestException('Inactive or invalid store.');
    }

    const today = new Date();
    
    // Find active fiscal year
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { 
        store_id: req.store_id, 
        is_closed: false,
        start_date: { lte: today },
        end_date: { gte: today },
      }
    });

    if (!fy) {
      throw new BadRequestException('Active Fiscal Year not found for the transaction date.');
    }

    // Find open accounting period
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        store_id: req.store_id,
        fiscal_year_id: fy.id,
        status: AccountingPeriodStatus.OPEN,
        start_date: { lte: today },
        end_date: { gte: today },
      }
    });

    if (!period) {
      throw new BadRequestException('OPEN Accounting Period not found for the transaction date.');
    }

    return { fy, period };
  }
}
