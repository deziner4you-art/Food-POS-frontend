import { Injectable } from '@nestjs/common';
import { YearEndClosingRepository } from '../repositories/year-end-closing.repository';
import { YearEndClosingValidator } from '../validators/year-end-closing.validator';
import { YearEndClosingInput, YearEndClosingResult } from '../interfaces/year-end-closing.interface';
import { ClosingJournalService } from './closing-journal.service';
import { RetainedEarningsService } from './retained-earnings.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { YearEndClosingStartedEvent } from '../events/year-end-closing-started.event';
import { YearEndClosingCompletedEvent } from '../events/year-end-closing-completed.event';
import { RetainedEarningsTransferredEvent } from '../events/retained-earnings-transferred.event';
import { FiscalYearCreatedEvent } from '../events/fiscal-year-created.event';

@Injectable()
export class YearEndClosingService {
  constructor(
    private readonly repository: YearEndClosingRepository,
    private readonly validator: YearEndClosingValidator,
    private readonly closingJournalService: ClosingJournalService,
    private readonly retainedEarningsService: RetainedEarningsService,
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async executeYearEndClosing(input: YearEndClosingInput, userId: number): Promise<YearEndClosingResult> {
    await this.validator.validateReadiness(input);

    const session = await this.repository.createClosingSession(input.store_id, input.fiscal_year_id, userId);
    
    this.eventBus.publish(new YearEndClosingStartedEvent(
      input.store_id, 0, userId, session.id.toString(), 'year_end_started', { fiscal_year: input.fiscal_year_id }
    ));

    await this.repository.addLog(session.id, 'Verify Balances', 'SUCCESS');

    // Transfer P/L
    const transferResult = await this.retainedEarningsService.transferProfitLoss(
      input.store_id, input.fiscal_year_id, input.retained_earnings_account_id, session.id, userId
    );

    this.eventBus.publish(new RetainedEarningsTransferredEvent(
      input.store_id, 0, userId, session.id.toString(), 'retained_earnings_transferred', { amount: transferResult.amount, type: transferResult.transfer_type }
    ));

    // Close Journals
    await this.closingJournalService.closeRevenueAndExpenseAccounts(input.store_id, input.fiscal_year_id, session.id);

    // Lock Fiscal Year
    const currentFy = await this.prisma.fiscalYear.update({
      where: { id: input.fiscal_year_id },
      data: { is_closed: true }
    });
    await this.repository.addLog(session.id, 'Lock Fiscal Year', 'SUCCESS');

    // Create Next Fiscal Year
    const nextStart = new Date(currentFy.start_date);
    nextStart.setFullYear(nextStart.getFullYear() + 1);
    const nextEnd = new Date(currentFy.end_date);
    nextEnd.setFullYear(nextEnd.getFullYear() + 1);

    const newFy = await this.prisma.fiscalYear.create({
      data: {
        store_id: input.store_id,
        start_date: nextStart,
        end_date: nextEnd,
        is_closed: false
      }
    });

    await this.repository.addLog(session.id, 'Create Next Fiscal Year', 'SUCCESS', `Created FY ${newFy.id}`);
    this.eventBus.publish(new FiscalYearCreatedEvent(
      input.store_id, 0, userId, newFy.id.toString(), 'fiscal_year_created', { year: newFy.id }
    ));

    const finalSession = await this.repository.completeClosing(session.id, 'COMPLETED');

    this.eventBus.publish(new YearEndClosingCompletedEvent(
      input.store_id, 0, userId, finalSession.id.toString(), 'year_end_completed', {}
    ));

    return {
      id: finalSession.id,
      store_id: finalSession.store_id,
      fiscal_year_id: finalSession.fiscal_year_id,
      status: finalSession.status,
      started_at: finalSession.started_at,
      completed_at: finalSession.completed_at
    };
  }
}
