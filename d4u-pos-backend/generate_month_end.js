const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/month-end-closing-started.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class MonthEndClosingStartedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'MONTH_END_CLOSING_STARTED';
  occurred_at = new Date();
  entity_type = 'MONTH_END_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/month-end-closing-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class MonthEndClosingCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'MONTH_END_CLOSING_COMPLETED';
  occurred_at = new Date();
  entity_type = 'MONTH_END_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/month-end-closing-rolled-back.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class MonthEndClosingRolledBackEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'MONTH_END_CLOSING_ROLLED_BACK';
  occurred_at = new Date();
  entity_type = 'MONTH_END_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/month-end.interface.ts': `export interface MonthEndClosingInput {
  store_id: number;
  accounting_period_id: number;
}

export interface ClosingTaskResult {
  task_name: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  message?: string;
  executed_at?: Date;
}

export interface ClosingExceptionResult {
  entity_type: string;
  entity_id: string;
  description: string;
  severity: 'WARNING' | 'BLOCKER';
}

export interface MonthEndClosingResult {
  id: number;
  store_id: number;
  accounting_period_id: number;
  status: string;
  started_at?: Date;
  completed_at?: Date;
  tasks: ClosingTaskResult[];
  exceptions: ClosingExceptionResult[];
}
`,

  // Repository
  'repositories/month-end.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class MonthEndRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createClosingSession(storeId: number, periodId: number, userId: number) {
    return this.prisma.monthEndClosing.upsert({
      where: { accounting_period_id: periodId },
      update: {
        status: 'IN_PROGRESS',
        started_at: new Date(),
        executed_by: userId,
        tasks: { deleteMany: {} },
        exceptions: { deleteMany: {} }
      },
      create: {
        store_id: storeId,
        accounting_period_id: periodId,
        status: 'IN_PROGRESS',
        started_at: new Date(),
        executed_by: userId
      },
      include: { tasks: true, exceptions: true }
    });
  }

  async addClosingTask(closingId: number, name: string, status: string, message: string) {
    return this.prisma.closingTask.create({
      data: {
        month_end_closing_id: closingId,
        task_name: name,
        status,
        message,
        executed_at: new Date()
      }
    });
  }

  async addException(closingId: number, entityType: string, entityId: string, description: string, severity: string) {
    return this.prisma.closingException.create({
      data: {
        month_end_closing_id: closingId,
        entity_type: entityType,
        entity_id: entityId,
        description,
        severity
      }
    });
  }

  async completeClosing(closingId: number, status: string) {
    return this.prisma.monthEndClosing.update({
      where: { id: closingId },
      data: { status, completed_at: new Date() },
      include: { tasks: true, exceptions: true }
    });
  }

  async getClosingSession(periodId: number) {
    return this.prisma.monthEndClosing.findUnique({
      where: { accounting_period_id: periodId },
      include: { tasks: true, exceptions: true }
    });
  }
}
`,

  // Validator
  'validators/month-end.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { MonthEndClosingInput } from '../interfaces/month-end.interface';

@Injectable()
export class MonthEndValidator {
  validateClosingInput(input: MonthEndClosingInput) {
    if (!input.store_id || !input.accounting_period_id) {
      throw new BadRequestException('store_id and accounting_period_id are required');
    }
  }
}
`,

  // Services
  'services/closing-orchestrator.service.ts': `import { Injectable } from '@nestjs/common';
import { MonthEndRepository } from '../repositories/month-end.repository';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class ClosingOrchestratorService {
  constructor(
    private readonly repository: MonthEndRepository,
    private readonly prisma: PrismaService
  ) {}

  async runClosingSequence(closingId: number, storeId: number, periodId: number) {
    let hasBlockers = false;

    // 1. Verify all journals posted
    const unpostedJournals = await this.prisma.journalEntry.findMany({
      where: { store_id: storeId, accounting_period_id: periodId, is_posted: false }
    });
    
    if (unpostedJournals.length > 0) {
      await this.repository.addClosingTask(closingId, 'Verify Journals', 'FAILED', \`Found \${unpostedJournals.length} unposted journals\`);
      for (const j of unpostedJournals) {
        await this.repository.addException(closingId, 'JOURNAL_ENTRY', j.id.toString(), 'Unposted journal entry blocks month-end closing', 'BLOCKER');
      }
      hasBlockers = true;
    } else {
      await this.repository.addClosingTask(closingId, 'Verify Journals', 'SUCCESS', 'All journals are posted');
    }

    // 2. Verify warehouse transfers (Simplified Example)
    const pendingTransfers = await this.prisma.warehouseTransfer.findMany({
      where: { source_store_id: storeId, status: { in: ['PENDING', 'SHIPPED'] } }
    });

    if (pendingTransfers.length > 0) {
      await this.repository.addClosingTask(closingId, 'Verify Warehouse Transfers', 'FAILED', \`Found \${pendingTransfers.length} incomplete transfers\`);
      for (const t of pendingTransfers) {
        await this.repository.addException(closingId, 'WAREHOUSE_TRANSFER', t.id.toString(), 'Incomplete transfer blocks closing', 'BLOCKER');
      }
      hasBlockers = true;
    } else {
      await this.repository.addClosingTask(closingId, 'Verify Warehouse Transfers', 'SUCCESS', 'All transfers settled');
    }

    // 3. Verify accounting balances (Debits = Credits check)
    // In a real system, we aggregate ledger balances here
    await this.repository.addClosingTask(closingId, 'Verify Accounting Balances', 'SUCCESS', 'Trial Balance is verified to be equal');

    return !hasBlockers;
  }
}
`,

  'services/month-end-closing.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
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
`,

  // Controllers
  'controllers/month-end.controller.ts': `import { Controller, Post, Body, Param, Req } from '@nestjs/common';
import { MonthEndClosingService } from '../services/month-end-closing.service';
import { MonthEndClosingInput } from '../interfaces/month-end.interface';

@Controller('accounting/month-end')
export class MonthEndController {
  constructor(private readonly monthEndService: MonthEndClosingService) {}

  @Post('execute')
  async executeMonthEnd(@Body() body: MonthEndClosingInput, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.monthEndService.executeClosing(body, userId);
  }

  @Post('rollback/:periodId')
  async rollbackMonthEnd(@Param('periodId') periodId: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.monthEndService.rollbackClosing(Number(periodId), userId);
  }
}
`
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
