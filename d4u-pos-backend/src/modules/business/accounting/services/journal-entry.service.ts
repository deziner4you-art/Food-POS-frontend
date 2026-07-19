import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
      if (!account) throw new BadRequestException(`Account ID ${line.account_id} not found.`);
      if (!account.is_active) throw new BadRequestException(`Account ${account.code} is inactive.`);
    }

    if (!hasDebit) throw new BadRequestException('At least one Debit line is required.');
    if (!hasCredit) throw new BadRequestException('At least one Credit line is required.');
    
    // JS floating point comparison issue mitigation
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(`Debit Total (${totalDebit}) must equal Credit Total (${totalCredit}).`);
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
      description: `Reversal of ${entry.reference_number}`,
      cost_center_id: line.cost_center_id,
      profit_center_id: line.profit_center_id,
    }));

    return this.repo.create(storeId, {
      journal_id: entry.journal_id,
      fiscal_year_id: entry.fiscal_year_id,
      accounting_period_id: entry.accounting_period_id,
      posting_date: new Date(),
      reference_number: `REV-${entry.reference_number}`,
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
