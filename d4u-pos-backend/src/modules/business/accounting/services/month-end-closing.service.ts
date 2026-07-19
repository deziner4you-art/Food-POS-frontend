import { Injectable, BadRequestException } from '@nestjs/common';
import { MonthEndRepository } from '../repositories/month-end.repository';
import { MonthEndValidator } from '../validators/month-end.validator';
import { MonthEndClosingInput, MonthEndClosingResult } from '../interfaces/month-end.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { MonthEndClosingStartedEvent } from '../events/month-end-closing-started.event';
import { MonthEndClosingCompletedEvent } from '../events/month-end-closing-completed.event';
import { MonthEndClosingRolledBackEvent } from '../events/month-end-closing-rolled-back.event';
import { ClosingOrchestratorService } from './closing-orchestrator.service';
import { PeriodLockService } from './period-lock.service';

@Injectable()
export class MonthEndClosingService {
  constructor(
    private readonly repository: MonthEndRepository,
    private readonly validator: MonthEndValidator,
    private readonly orchestrator: ClosingOrchestratorService,
    private readonly periodLockService: PeriodLockService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async executeClosing(input: MonthEndClosingInput, userId: number): Promise<MonthEndClosingResult> {
    this.validator.validateClosingInput(input);

    const session = await this.repository.createClosingSession(input.store_id, input.accounting_period_id, userId);
    
    this.eventBus.publish(new MonthEndClosingStartedEvent(
      input.store_id, 0, userId, session.id.toString(), 'month_end_started', { period: input.accounting_period_id }
    ));

    const isSuccess = await this.orchestrator.runClosingSequence(session.id, input.store_id, input.accounting_period_id);

    let finalStatus = 'COMPLETED';
    if (!isSuccess) {
      finalStatus = 'FAILED';
    } else {
      // Actually Lock Period
      await this.periodLockService.lockPeriod(input.accounting_period_id, userId, 'SYSTEM_MONTH_END_CLOSE');
    }

    const completedSession = await this.repository.completeClosing(session.id, finalStatus);

    if (isSuccess) {
      this.eventBus.publish(new MonthEndClosingCompletedEvent(
        input.store_id, 0, userId, session.id.toString(), 'month_end_completed', { period: input.accounting_period_id }
      ));
    }

    return this.mapToResult(completedSession);
  }

  async rollbackClosing(periodId: number, userId: number): Promise<MonthEndClosingResult> {
    const session = await this.repository.getClosingSession(periodId);
    if (!session || session.status !== 'COMPLETED') {
      throw new BadRequestException('Can only rollback a completed closing session');
    }

    // Unlock Period
    await this.periodLockService.unlockPeriod(periodId, userId, 'SYSTEM_MONTH_END_ROLLBACK');
    
    const rolledBackSession = await this.repository.completeClosing(session.id, 'ROLLED_BACK');

    this.eventBus.publish(new MonthEndClosingRolledBackEvent(
      session.store_id, 0, userId, session.id.toString(), 'month_end_rollback', { period: periodId }
    ));

    return this.mapToResult(rolledBackSession);
  }

  private mapToResult(session: any): MonthEndClosingResult {
    return {
      id: session.id,
      store_id: session.store_id,
      accounting_period_id: session.accounting_period_id,
      status: session.status,
      started_at: session.started_at,
      completed_at: session.completed_at,
      tasks: session.tasks.map((t: any) => ({
        task_name: t.task_name,
        status: t.status,
        message: t.message,
        executed_at: t.executed_at
      })),
      exceptions: session.exceptions.map((e: any) => ({
        entity_type: e.entity_type,
        entity_id: e.entity_id,
        description: e.description,
        severity: e.severity
      }))
    };
  }
}
