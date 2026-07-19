import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PeriodClosingRepository } from '../repositories/period-closing.repository';
import { PeriodClosingValidator } from '../validators/period-closing.validator';
import { ClosingChecklistService } from './closing-checklist.service';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { FinancialPeriodClosingStartedEvent } from '../events/financial-period-closing-started.event';
import { FinancialPeriodClosedEvent } from '../events/financial-period-closed.event';
import { FinancialPeriodReopenedEvent } from '../events/financial-period-reopened.event';
import { ClosingResult } from '../interfaces/closing-result.interface';

@Injectable()
export class FinancialPeriodClosingService {
  private readonly logger = new Logger(FinancialPeriodClosingService.name);

  constructor(
    private readonly repository: PeriodClosingRepository,
    private readonly validator: PeriodClosingValidator,
    private readonly checklistService: ClosingChecklistService,
    private readonly eventBus: DomainEventBusService,
  ) {}

  async startClosing(storeId: number, periodId: number, userId: number): Promise<ClosingResult> {
    const period = await this.validator.validatePeriodExists(periodId);
    
    let closing: any = await this.repository.getClosingByPeriod(storeId, periodId);
    if (!closing) {
      closing = await this.repository.createOrUpdateClosing(storeId, period.fiscal_year_id, periodId, 'CLOSING', userId);
    } else if (closing.status === 'CLOSED' || closing.status === 'LOCKED') {
      throw new BadRequestException('Period is already closed or locked.');
    } else {
      closing = await this.repository.updateClosing(closing.id, { status: 'CLOSING' });
    }

    if (!closing) throw new BadRequestException('Closing record could not be created or updated.');

    await this.repository.addLog(closing.id, 'STATUS_CHANGE', 'OPEN', 'CLOSING', 'Closing process initiated', userId);
    this.eventBus.publish(new FinancialPeriodClosingStartedEvent(storeId, 0, userId, closing.id.toString(), 'startClosing', { periodId }));

    return {
      closing_id: closing.id,
      status: 'CLOSING',
      checklist_status: closing.checklist_status,
      messages: ['Closing process initiated.'],
    };
  }

  async closePeriod(closingId: number, userId: number): Promise<ClosingResult> {
    const closing = await this.repository.getClosingById(closingId);
    if (!closing || closing.status !== 'CLOSING') {
      throw new BadRequestException('Period must be in CLOSING status to perform final close.');
    }

    const allPassed = await this.checklistService.runAllValidations(closing.id, closing.store_id, closing.accounting_period_id, userId);

    if (!allPassed) {
      await this.repository.updateClosing(closing.id, { checklist_status: 'FAILED' });
      await this.repository.addLog(closing.id, 'VALIDATION_RUN', closing.status, closing.status, 'Checklist validation failed', userId);
      throw new BadRequestException('Pre-close validations failed. Resolve all pending transactions before closing.');
    }

    await this.repository.updateClosing(closing.id, { 
      status: 'CLOSED', 
      checklist_status: 'COMPLETED',
      closed_by: userId,
      closed_at: new Date()
    });

    await this.repository.addLog(closing.id, 'STATUS_CHANGE', 'CLOSING', 'CLOSED', 'Period officially closed', userId);
    this.eventBus.publish(new FinancialPeriodClosedEvent(closing.store_id, 0, userId, closing.id.toString(), 'closePeriod', { periodId: closing.accounting_period_id }));

    return {
      closing_id: closing.id,
      status: 'CLOSED',
      checklist_status: 'COMPLETED',
      messages: ['Period closed successfully.'],
    };
  }

  async lockPeriod(closingId: number, userId: number): Promise<ClosingResult> {
    const closing = await this.repository.getClosingById(closingId);
    if (!closing || closing.status !== 'CLOSED') {
      throw new BadRequestException('Period must be CLOSED before it can be LOCKED.');
    }

    await this.repository.updateClosing(closing.id, { status: 'LOCKED' });
    await this.repository.addLog(closing.id, 'STATUS_CHANGE', 'CLOSED', 'LOCKED', 'Period locked for audit', userId);

    return {
      closing_id: closing.id,
      status: 'LOCKED',
      checklist_status: 'COMPLETED',
      messages: ['Period permanently locked.'],
    };
  }

  async reopenPeriod(closingId: number, reason: string, userId: number): Promise<ClosingResult> {
    const closing = await this.repository.getClosingById(closingId);
    if (!closing || closing.status === 'OPEN') {
      throw new BadRequestException('Period is not closed.');
    }

    // Require specific audit log
    if (!reason || reason.length < 10) {
      throw new BadRequestException('A detailed reason is required to reopen a period.');
    }

    const oldStatus = closing.status;
    await this.repository.updateClosing(closing.id, { 
      status: 'REOPENED',
      reopened_by: userId,
      reason: reason
    });

    await this.repository.addLog(closing.id, 'REOPEN', oldStatus, 'REOPENED', reason, userId);
    this.eventBus.publish(new FinancialPeriodReopenedEvent(closing.store_id, 0, userId, closing.id.toString(), 'reopenPeriod', { periodId: closing.accounting_period_id, reason }));

    return {
      closing_id: closing.id,
      status: 'REOPENED',
      checklist_status: closing.checklist_status,
      messages: ['Period reopened for adjustments.'],
    };
  }
}
