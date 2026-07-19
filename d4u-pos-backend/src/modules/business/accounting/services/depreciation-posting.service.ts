import { Injectable } from '@nestjs/common';
import { DepreciationRepository } from '../repositories/depreciation.repository';
import { DepreciationValidator } from '../validators/depreciation.validator';
import { JournalEntryService } from './journal-entry.service';
import { PostDepreciationInput } from '../interfaces/depreciation-posting.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { DepreciationPostedEvent } from '../events/depreciation-posted.event';

@Injectable()
export class DepreciationPostingService {
  constructor(
    private readonly repository: DepreciationRepository,
    private readonly validator: DepreciationValidator,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async postDepreciation(input: PostDepreciationInput, userId: number) {
    const schedule = await this.repository.getScheduleById(input.schedule_id);
    if (!schedule) throw new Error('Schedule not found');
    this.validator.validatePosting(schedule);

    const asset = schedule.asset_depreciation.asset;

    // Create Journal Entry
    const journalDto: any = {
      fiscal_year_id: 1, // In real implementation, this would be looked up based on schedule.period_end
      accounting_period_id: 1,      // Ditto
      currency_id: 1,    // Ditto
      posting_date: schedule.period_end,
      reference_number: `DEPR-${asset.code}-${schedule.id}`,
      description: `Depreciation for ${asset.code}`,
      lines: [
        {
          account_id: input.depreciation_expense_account_id,
          debit_amount: Number(schedule.amount),
          credit_amount: 0,
          description: 'Depreciation Expense'
        },
        {
          account_id: input.accumulated_depreciation_account_id,
          debit_amount: 0,
          credit_amount: Number(schedule.amount),
          description: 'Accumulated Depreciation'
        }
      ]
    };

    const je = await this.journalService.create(asset.store_id, journalDto);
    // Move through workflow
    await this.journalService.submit(asset.store_id, je.id);
    await this.journalService.approve(asset.store_id, je.id);

    const posting = await this.repository.recordPosting({
      asset_depreciation_id: schedule.asset_depreciation_id,
      schedule_id: schedule.id,
      journal_entry_id: je.id,
      posting_date: new Date(),
      amount: schedule.amount,
      executed_by: userId
    });

    this.eventBus.publish(new DepreciationPostedEvent(
      asset.store_id, 0, userId, posting.id.toString(), 'depreciation_posted', { amount: posting.amount }
    ));

    return posting;
  }
}
