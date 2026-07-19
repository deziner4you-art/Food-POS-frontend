const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Enums update
  'enums/accounting-period-status.enum.ts': `export enum AccountingPeriodStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  LOCKED = 'LOCKED',
}
`,

  // DTOs - Fiscal Year
  'dto/create-fiscal-year.dto.ts': `import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateFiscalYearDto {
  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;
}
`,
  'dto/update-fiscal-year.dto.ts': `import { IsDateString, IsOptional } from 'class-validator';

export class UpdateFiscalYearDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
`,
  'dto/close-fiscal-year.dto.ts': `export class CloseFiscalYearDto {}`,

  // DTOs - Accounting Period
  'dto/create-accounting-period.dto.ts': `import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateAccountingPeriodDto {
  @IsNotEmpty()
  @IsInt()
  fiscal_year_id: number;
}
`,
  'dto/update-accounting-period.dto.ts': `export class UpdateAccountingPeriodDto {}`,
  'dto/close-accounting-period.dto.ts': `export class CloseAccountingPeriodDto {}`,

  // Repositories
  'repositories/fiscal-year.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class FiscalYearRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, startDate: Date, endDate: Date) {
    return this.prisma.fiscalYear.create({
      data: {
        store_id: storeId,
        start_date: startDate,
        end_date: endDate,
        is_closed: false,
      },
    });
  }

  async findActive(storeId: number) {
    return this.prisma.fiscalYear.findFirst({
      where: { store_id: storeId, is_closed: false },
    });
  }

  async findOverlapping(storeId: number, startDate: Date, endDate: Date, excludeId?: number) {
    return this.prisma.fiscalYear.findFirst({
      where: {
        store_id: storeId,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: [
          { start_date: { lte: endDate }, end_date: { gte: startDate } },
        ],
      },
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.fiscalYear.findFirst({
      where: { id, store_id: storeId },
      include: { accounting_periods: true },
    });
  }

  async findAll(storeId: number) {
    return this.prisma.fiscalYear.findMany({
      where: { store_id: storeId },
      orderBy: { start_date: 'desc' },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.fiscalYear.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }
}
`,
  'repositories/accounting-period.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class AccountingPeriodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(periods: any[]) {
    return this.prisma.accountingPeriod.createMany({
      data: periods,
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.accountingPeriod.findFirst({
      where: { id, store_id: storeId },
    });
  }

  async findAllByFiscalYear(storeId: number, fiscalYearId: number) {
    return this.prisma.accountingPeriod.findMany({
      where: { store_id: storeId, fiscal_year_id: fiscalYearId },
      orderBy: { start_date: 'asc' },
    });
  }

  async countOpenPeriods(storeId: number, fiscalYearId: number) {
    return this.prisma.accountingPeriod.count({
      where: { store_id: storeId, fiscal_year_id: fiscalYearId, status: AccountingPeriodStatus.OPEN },
    });
  }

  async updateStatus(id: number, storeId: number, status: AccountingPeriodStatus) {
    return this.prisma.accountingPeriod.updateMany({
      where: { id, store_id: storeId },
      data: { status },
    });
  }
}
`,

  // Services
  'services/fiscal-year.service.ts': `import { Injectable, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
`,
  'services/accounting-period.service.ts': `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    return { message: \`Created \${periods.length} monthly periods successfully.\` };
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
    return { message: \`Period status updated to \${newStatus}.\` };
  }

  async findAllByFiscalYear(storeId: number, fiscalYearId: number) {
    return this.repo.findAllByFiscalYear(storeId, fiscalYearId);
  }
}
`,

  // Controllers
  'controllers/fiscal-year.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FiscalYearService } from '../services/fiscal-year.service';
import { CreateFiscalYearDto } from '../dto/create-fiscal-year.dto';
import { UpdateFiscalYearDto } from '../dto/update-fiscal-year.dto';

@Controller('accounting/fiscal-years')
export class FiscalYearController {
  constructor(private readonly fyService: FiscalYearService) {}

  @Get('active')
  async getActive(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.fyService.getActive(store_id);
  }

  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.fyService.findAll(store_id);
  }

  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateFiscalYearDto,
  ) {
    return this.fyService.create(store_id, dto);
  }

  @Patch(':id')
  async update(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFiscalYearDto,
  ) {
    return this.fyService.update(store_id, id, dto);
  }

  @Patch(':id/close')
  async close(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fyService.close(store_id, id);
  }

  @Patch(':id/open')
  async open(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('is_admin') isAdmin: string,
  ) {
    return this.fyService.open(store_id, id, isAdmin === 'true');
  }
}
`,
  'controllers/accounting-period.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { AccountingPeriodService } from '../services/accounting-period.service';
import { CreateAccountingPeriodDto } from '../dto/create-accounting-period.dto';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Controller('accounting/periods')
export class AccountingPeriodController {
  constructor(private readonly periodService: AccountingPeriodService) {}

  @Get('fiscal-year/:fy_id')
  async findAllByFiscalYear(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('fy_id', ParseIntPipe) fy_id: number,
  ) {
    return this.periodService.findAllByFiscalYear(store_id, fy_id);
  }

  @Post('monthly')
  async createMonthly(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateAccountingPeriodDto,
  ) {
    return this.periodService.createMonthlyPeriods(store_id, dto);
  }

  @Patch(':id/close')
  async close(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.CLOSED);
  }

  @Patch(':id/open')
  async open(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.OPEN);
  }

  @Patch(':id/lock')
  async lock(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.LOCKED);
  }

  @Patch(':id/unlock')
  async unlock(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // In real app, check for ADMIN permissions here
    return this.periodService.updateStatus(store_id, id, AccountingPeriodStatus.OPEN);
  }
}
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
