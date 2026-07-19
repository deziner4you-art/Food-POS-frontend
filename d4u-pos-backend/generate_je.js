const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Enums
  'enums/journal-entry-status.enum.ts': `export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED',
}
`,

  // DTOs
  'dto/create-journal-entry.dto.ts': `import { IsString, IsInt, IsOptional, IsArray, ValidateNested, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryLineDto {
  @IsInt()
  account_id: number;

  @IsNumber()
  @Min(0)
  debit_amount: number;

  @IsNumber()
  @Min(0)
  credit_amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  cost_center_id?: number;

  @IsOptional()
  @IsInt()
  profit_center_id?: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreateJournalEntryDto {
  @IsInt()
  journal_id: number;

  @IsInt()
  fiscal_year_id: number;

  @IsInt()
  accounting_period_id: number;

  @IsDateString()
  posting_date: string;

  @IsString()
  reference_number: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  currency_id?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}
`,
  'dto/update-journal-entry.dto.ts': `import { PartialType } from '@nestjs/mapped-types';
import { CreateJournalEntryDto } from './create-journal-entry.dto';

export class UpdateJournalEntryDto extends PartialType(CreateJournalEntryDto) {}
`,
  'dto/approve-journal-entry.dto.ts': `export class ApproveJournalEntryDto {}`,
  'dto/reverse-journal-entry.dto.ts': `import { IsString, IsNotEmpty } from 'class-validator';

export class ReverseJournalEntryDto {
  @IsNotEmpty()
  @IsString()
  reversal_reason: string;
}
`,

  // Repositories
  'repositories/journal-entry.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { JournalEntryStatus } from '../enums/journal-entry-status.enum';

@Injectable()
export class JournalEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(storeId: number, data: any, lines: any[]) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          store_id: storeId,
          ...data,
          lines: {
            create: lines.map(line => ({ ...line, store_id: storeId })),
          },
        },
        include: { lines: true },
      });
      return entry;
    });
  }

  async findById(storeId: number, id: number) {
    return this.prisma.journalEntry.findFirst({
      where: { id, store_id: storeId },
      include: { lines: true },
    });
  }

  async findByReference(storeId: number, ref: string) {
    return this.prisma.journalEntry.findFirst({
      where: { store_id: storeId, reference_number: ref },
    });
  }

  async updateStatus(id: number, storeId: number, status: JournalEntryStatus) {
    return this.prisma.journalEntry.updateMany({
      where: { id, store_id: storeId },
      data: { status },
    });
  }

  async update(id: number, storeId: number, data: any) {
    return this.prisma.journalEntry.updateMany({
      where: { id, store_id: storeId },
      data,
    });
  }

  async findAll(storeId: number) {
    return this.prisma.journalEntry.findMany({
      where: { store_id: storeId },
      orderBy: { posting_date: 'desc' },
      include: { lines: true },
    });
  }
}
`,
  'repositories/journal-entry-line.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class JournalEntryLineRepository {
  constructor(private readonly prisma: PrismaService) {}
  // Handled mostly inside JournalEntry transactions
}
`,

  // Service
  'services/journal-entry.service.ts': `import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import { AccountRepository } from '../repositories/account.repository';
import { FiscalYearRepository } from '../repositories/fiscal-year.repository';
import { AccountingPeriodRepository } from '../repositories/accounting-period.repository';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { ReverseJournalEntryDto } from '../dto/reverse-journal-entry.dto';
import { JournalEntryStatus } from '../enums/journal-entry-status.enum';
import { AccountingPeriodStatus } from '../enums/accounting-period-status.enum';

@Injectable()
export class JournalEntryService {
  constructor(
    private readonly repo: JournalEntryRepository,
    private readonly accountRepo: AccountRepository,
    private readonly fyRepo: FiscalYearRepository,
    private readonly periodRepo: AccountingPeriodRepository,
  ) {}

  private async validateEntryLines(storeId: number, lines: any[]) {
    if (lines.length < 2) throw new BadRequestException('Journal Entry must contain at least two lines.');

    let totalDebit = 0;
    let totalCredit = 0;
    let hasDebit = false;
    let hasCredit = false;

    for (const line of lines) {
      if (line.debit_amount < 0 || line.credit_amount < 0) {
        throw new BadRequestException('Negative amounts are rejected.');
      }
      if (line.debit_amount > 0 && line.credit_amount > 0) {
        throw new BadRequestException('Both Debit and Credit cannot exist on the same line.');
      }
      if (line.debit_amount > 0) {
        hasDebit = true;
        totalDebit += line.debit_amount;
      }
      if (line.credit_amount > 0) {
        hasCredit = true;
        totalCredit += line.credit_amount;
      }

      const account = await this.accountRepo.findById(storeId, line.account_id);
      if (!account) throw new BadRequestException(\`Account ID \${line.account_id} not found.\`);
      if (!account.is_active) throw new BadRequestException(\`Account \${account.code} is inactive.\`);
    }

    if (!hasDebit) throw new BadRequestException('At least one Debit line is required.');
    if (!hasCredit) throw new BadRequestException('At least one Credit line is required.');
    
    // JS floating point comparison issue mitigation
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(\`Debit Total (\${totalDebit}) must equal Credit Total (\${totalCredit}).\`);
    }

    return totalDebit;
  }

  async create(storeId: number, dto: CreateJournalEntryDto) {
    const existingRef = await this.repo.findByReference(storeId, dto.reference_number);
    if (existingRef) throw new BadRequestException('Reference number must be unique.');

    const fy = await this.fyRepo.findById(storeId, dto.fiscal_year_id);
    if (!fy) throw new NotFoundException('Fiscal Year not found.');
    if (fy.is_closed) throw new BadRequestException('Fiscal Year must be ACTIVE (open).');

    const period = await this.periodRepo.findById(storeId, dto.accounting_period_id);
    if (!period) throw new NotFoundException('Accounting Period not found.');
    if (period.status !== AccountingPeriodStatus.OPEN) throw new BadRequestException('Accounting Period must be OPEN.');

    const totalAmount = await this.validateEntryLines(storeId, dto.lines);

    const { lines, ...entryData } = dto;
    return this.repo.create(storeId, {
      ...entryData,
      posting_date: new Date(dto.posting_date),
      total_amount: totalAmount,
      status: JournalEntryStatus.DRAFT,
    }, lines);
  }

  async updateDraft(storeId: number, id: number, dto: UpdateJournalEntryDto) {
    const entry = await this.repo.findById(storeId, id);
    if (!entry) throw new NotFoundException('Journal Entry not found.');
    if (entry.status !== JournalEntryStatus.DRAFT) throw new BadRequestException('Only DRAFT entries can be updated.');

    // Simplified update (usually would replace all lines in transaction)
    // For MVP, if lines exist, we just block complex line updates here without a transaction 
    // or we recreate. We will only allow updating metadata for now to keep it safe.
    const { lines, posting_date, ...data } = dto;
    
    return this.repo.update(id, storeId, {
      ...data,
      ...(posting_date ? { posting_date: new Date(posting_date) } : {}),
    });
  }

  async submit(storeId: number, id: number) {
    const entry = await this.repo.findById(storeId, id);
    if (!entry) throw new NotFoundException('Journal Entry not found.');
    if (entry.status !== JournalEntryStatus.DRAFT) throw new BadRequestException('Only DRAFT entries can be submitted.');

    return this.repo.updateStatus(id, storeId, JournalEntryStatus.PENDING_APPROVAL);
  }

  async approve(storeId: number, id: number) {
    const entry = await this.repo.findById(storeId, id);
    if (!entry) throw new NotFoundException('Journal Entry not found.');
    if (entry.status !== JournalEntryStatus.PENDING_APPROVAL) throw new BadRequestException('Entry is not pending approval.');

    // Transition directly to POSTED (as per requirements standard ERP)
    return this.repo.updateStatus(id, storeId, JournalEntryStatus.POSTED);
  }

  async reverse(storeId: number, id: number, dto: ReverseJournalEntryDto) {
    const entry = await this.repo.findById(storeId, id);
    if (!entry) throw new NotFoundException('Journal Entry not found.');
    if (entry.status !== JournalEntryStatus.POSTED) throw new BadRequestException('Only POSTED entries can be reversed.');

    const period = await this.periodRepo.findById(storeId, entry.accounting_period_id);
    if (period && period.status !== AccountingPeriodStatus.OPEN) {
      throw new BadRequestException('Cannot reverse entry in a CLOSED or LOCKED accounting period.');
    }

    // 1. Mark original as REVERSED
    await this.repo.updateStatus(id, storeId, JournalEntryStatus.REVERSED);

    // 2. Create Reversal Entry
    const reversedLines = entry.lines.map(line => ({
      account_id: line.account_id,
      debit_amount: line.credit_amount, // Swap
      credit_amount: line.debit_amount, // Swap
      description: \`Reversal of \${entry.reference_number}\`,
      cost_center_id: line.cost_center_id,
      profit_center_id: line.profit_center_id,
    }));

    return this.repo.create(storeId, {
      journal_id: entry.journal_id,
      fiscal_year_id: entry.fiscal_year_id,
      accounting_period_id: entry.accounting_period_id,
      posting_date: new Date(),
      reference_number: \`REV-\${entry.reference_number}\`,
      reference_type: 'REVERSAL',
      reference_id: entry.id.toString(),
      description: dto.reversal_reason,
      currency_id: entry.currency_id,
      total_amount: entry.total_amount,
      status: JournalEntryStatus.POSTED,
    }, reversedLines);
  }

  async findAll(storeId: number) {
    return this.repo.findAll(storeId);
  }

  async findById(storeId: number, id: number) {
    const entry = await this.repo.findById(storeId, id);
    if (!entry) throw new NotFoundException('Journal Entry not found.');
    return entry;
  }
}
`,

  // Controller
  'controllers/journal-entry.controller.ts': `import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { JournalEntryService } from '../services/journal-entry.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { ReverseJournalEntryDto } from '../dto/reverse-journal-entry.dto';
import { ApproveJournalEntryDto } from '../dto/approve-journal-entry.dto';

@Controller('accounting/journal-entries')
export class JournalEntryController {
  constructor(private readonly service: JournalEntryService) {}

  @Get()
  async findAll(@Query('store_id', ParseIntPipe) store_id: number) {
    return this.service.findAll(store_id);
  }

  @Get(':id')
  async findById(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.findById(store_id, id);
  }

  @Post()
  async create(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.service.create(store_id, dto);
  }

  @Patch(':id/draft')
  async updateDraft(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.service.updateDraft(store_id, id, dto);
  }

  @Post(':id/submit')
  async submit(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.submit(store_id, id);
  }

  @Post(':id/approve')
  async approve(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveJournalEntryDto,
  ) {
    return this.service.approve(store_id, id);
  }

  @Post(':id/reverse')
  async reverse(
    @Query('store_id', ParseIntPipe) store_id: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReverseJournalEntryDto,
  ) {
    return this.service.reverse(store_id, id, dto);
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
