import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountingPeriodRepository } from '../repositories/accounting-period.repository';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { CreateAccountingPeriodDto } from '../dto/create-accounting-period.dto';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class AccountingPeriodService {
  constructor(
    private readonly repo: AccountingPeriodRepository,
    private readonly fyRepo: FiscalYearRepository,
  ) {}

  async createMonthlyPeriods(storeId: number, dto: CreateAccountingPeriodDto) {
    const fy = await this.fyRepo.findById(storeId, dto.fiscal_year_id);
    if (!fy) throw new NotFoundException('Fiscal Year not found.');
    if (fy.is_closed) throw new BadRequestException('Cannot create periods for a closed Fiscal Year.');

    if (fy.accounting_periods && fy.accounting_periods.length > 0) {
      throw new BadRequestException('Accounting periods already exist for this Fiscal Year.');
    }

    const periods = [];
    let currentStart = new Date(fy.start_date);
    const endLimit = new Date(fy.end_date);

    while (currentStart <= endLimit) {
      const year = currentStart.getFullYear();
      const month = currentStart.getMonth() + 1;
      
      const currentEnd = new Date(year, month, 0); // Last day of the month
      
      const finalEnd = currentEnd > endLimit ? endLimit : currentEnd;

      periods.push({
        store_id: storeId,
        fiscal_year_id: fy.id,
        month,
        year,
        start_date: currentStart,
        end_date: finalEnd,
        status: AccountingPeriodStatus.OPEN,
      });

      currentStart = new Date(year, month, 1);
    }

    await this.repo.createMany(periods);
    return { message: `Created ${periods.length} monthly periods successfully.` };
  }

  async updateStatus(storeId: number, id: number, newStatus: AccountingPeriodStatus) {
    const period = await this.repo.findById(storeId, id);
    if (!period) throw new NotFoundException('Accounting period not found.');
    
    if (period.status === AccountingPeriodStatus.LOCKED && newStatus !== AccountingPeriodStatus.LOCKED) {
       // Typically only admins can unlock, but we simplify for now
    }

    if (period.status === AccountingPeriodStatus.CLOSED && newStatus === AccountingPeriodStatus.OPEN) {
       // Cannot easily reopen
    }

    await this.repo.updateStatus(id, storeId, newStatus);
    return { message: `Period status updated to ${newStatus}.` };
  }

  async findAllByFiscalYear(storeId: number, fiscalYearId: number) {
    return this.repo.findAllByFiscalYear(storeId, fiscalYearId);
  }
}
