import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { AccountingPeriodRepository } from '../repositories/accounting-period.repository';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from '../dto/update-fiscal-year.dto';

@Injectable()
export class FiscalYearService {
  constructor(
    private readonly repo: FiscalYearRepository,
    private readonly periodRepo: AccountingPeriodRepository,
  ) {}

  async create(storeId: number, dto: CreateFiscalYearDto) {
    const start = new Date(dto.start_date);
    const end = new Date(dto.end_date);
    if (start >= end) throw new BadRequestException('Start date must be before end date.');

    const active = await this.repo.findActive(storeId);
    if (active) throw new BadRequestException('Another active fiscal year already exists. Close it first.');

    const overlap = await this.repo.findOverlapping(storeId, start, end);
    if (overlap) throw new BadRequestException('Fiscal year dates overlap with an existing fiscal year.');

    return this.repo.create(storeId, start, end);
  }

  async update(storeId: number, id: number, dto: UpdateFiscalYearDto) {
    const fy = await this.repo.findById(storeId, id);
    if (!fy) throw new NotFoundException('Fiscal year not found.');
    if (fy.is_closed) throw new BadRequestException('Cannot edit a closed fiscal year.');

    const start = dto.start_date ? new Date(dto.start_date) : fy.start_date;
    const end = dto.end_date ? new Date(dto.end_date) : fy.end_date;
    if (start >= end) throw new BadRequestException('Start date must be before end date.');

    const overlap = await this.repo.findOverlapping(storeId, start, end, id);
    if (overlap) throw new BadRequestException('Fiscal year dates overlap with an existing fiscal year.');

    return this.repo.update(id, storeId, { start_date: start, end_date: end });
  }

  async close(storeId: number, id: number) {
    const fy = await this.repo.findById(storeId, id);
    if (!fy) throw new NotFoundException('Fiscal year not found.');
    if (fy.is_closed) return { message: 'Already closed' };

    const openPeriodsCount = await this.periodRepo.countOpenPeriods(storeId, id);
    if (openPeriodsCount > 0) {
      throw new BadRequestException('Cannot close Fiscal Year while open Accounting Periods exist.');
    }

    await this.repo.update(id, storeId, { is_closed: true });
    return { message: 'Fiscal Year closed successfully.' };
  }

  async open(storeId: number, id: number, hasAdminPerm: boolean) {
    const fy = await this.repo.findById(storeId, id);
    if (!fy) throw new NotFoundException('Fiscal year not found.');
    if (!fy.is_closed) return { message: 'Already open' };

    if (!hasAdminPerm) {
      throw new UnauthorizedException('Cannot reopen a Fiscal Year without ADMIN permissions.');
    }

    const active = await this.repo.findActive(storeId);
    if (active) throw new BadRequestException('Another active fiscal year already exists. Close it first.');

    await this.repo.update(id, storeId, { is_closed: false });
    return { message: 'Fiscal Year reopened successfully.' };
  }

  async getActive(storeId: number) {
    return this.repo.findActive(storeId);
  }

  async findAll(storeId: number) {
    return this.repo.findAll(storeId);
  }
}
