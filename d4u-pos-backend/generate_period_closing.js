const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/financial-period-closing-started.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialPeriodClosingStartedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_PERIOD_CLOSING_STARTED';
  occurred_at = new Date();
  entity_type = 'PERIOD_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/financial-period-closed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialPeriodClosedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_PERIOD_CLOSED';
  occurred_at = new Date();
  entity_type = 'PERIOD_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/financial-period-reopened.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class FinancialPeriodReopenedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'FINANCIAL_PERIOD_REOPENED';
  occurred_at = new Date();
  entity_type = 'PERIOD_CLOSING';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/period-closing.interface.ts': `export interface ClosingChecklistStatus {
  module: string;
  status: 'PENDING' | 'PASSED' | 'FAILED';
  validation_message?: string;
}

export interface ReopenPeriodDto {
  closing_id: number;
  reason: string;
}
`,

  'interfaces/closing-result.interface.ts': `export interface ClosingResult {
  closing_id: number;
  status: string;
  checklist_status: string;
  messages: string[];
}
`,

  // Repository
  'repositories/period-closing.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PeriodClosingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getClosingByPeriod(storeId: number, periodId: number) {
    return this.prisma.periodClosing.findFirst({
      where: { store_id: storeId, accounting_period_id: periodId },
      include: { checklists: true, logs: true }
    });
  }

  async getClosingById(id: number) {
    return this.prisma.periodClosing.findUnique({
      where: { id },
      include: { checklists: true, logs: true, accounting_period: true }
    });
  }

  async createOrUpdateClosing(storeId: number, fiscalYearId: number, periodId: number, status: string, userId: number) {
    return this.prisma.periodClosing.upsert({
      where: { accounting_period_id: periodId },
      update: { status },
      create: {
        store_id: storeId,
        fiscal_year_id: fiscalYearId,
        accounting_period_id: periodId,
        status: status,
        opened_by: userId,
      }
    });
  }

  async updateClosing(id: number, data: any) {
    return this.prisma.periodClosing.update({
      where: { id },
      data
    });
  }

  async upsertChecklist(closingId: number, moduleName: string, status: string, message: string, userId: number) {
    // Find first, update if exists, otherwise create
    const existing = await this.prisma.closingChecklist.findFirst({
      where: { closing_id: closingId, module: moduleName }
    });

    if (existing) {
      return this.prisma.closingChecklist.update({
        where: { id: existing.id },
        data: { status, validation_message: message, validated_at: new Date(), validated_by: userId }
      });
    } else {
      return this.prisma.closingChecklist.create({
        data: {
          closing_id: closingId,
          module: moduleName,
          status,
          validation_message: message,
          validated_at: new Date(),
          validated_by: userId
        }
      });
    }
  }

  async addLog(closingId: number, action: string, oldStatus: string | null, newStatus: string | null, reason: string | null, userId: number) {
    return this.prisma.closingLog.create({
      data: {
        closing_id: closingId,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        reason,
        performed_by: userId,
      }
    });
  }
}
`,

  // Validator
  'validators/period-closing.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PeriodClosingValidator {
  constructor(private readonly prisma: PrismaService) {}

  async validatePeriodExists(periodId: number) {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new BadRequestException('Accounting period not found.');
    return period;
  }
}
`,

  // Services
  'services/closing-checklist.service.ts': `import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PeriodClosingRepository } from '../repositories/period-closing.repository';
import { ClosingChecklistStatus } from '../interfaces/period-closing.interface';

@Injectable()
export class ClosingChecklistService {
  private readonly logger = new Logger(ClosingChecklistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PeriodClosingRepository,
  ) {}

  async validateAccounting(storeId: number, periodId: number): Promise<ClosingChecklistStatus> {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { module: 'ACCOUNTING', status: 'FAILED', validation_message: 'Period missing' };

    // Check draft vouchers
    const draftVouchers = await this.prisma.voucher.count({
      where: { store_id: storeId, status: 'DRAFT', transaction_date: { gte: period.start_date, lte: period.end_date } }
    });

    if (draftVouchers > 0) return { module: 'ACCOUNTING', status: 'FAILED', validation_message: \`\${draftVouchers} draft vouchers found.\` };

    return { module: 'ACCOUNTING', status: 'PASSED' };
  }

  async validateInventory(storeId: number, periodId: number): Promise<ClosingChecklistStatus> {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { module: 'INVENTORY', status: 'FAILED', validation_message: 'Period missing' };

    // Pending stock counts, wastes, reservations
    const pendingTransfers = await this.prisma.warehouseTransfer.count({
      where: { store_id: storeId, status: 'IN_TRANSIT', created_at: { gte: period.start_date, lte: period.end_date } }
    });

    if (pendingTransfers > 0) return { module: 'INVENTORY', status: 'FAILED', validation_message: \`\${pendingTransfers} pending warehouse transfers.\` };

    return { module: 'INVENTORY', status: 'PASSED' };
  }

  async validateProduction(storeId: number, periodId: number): Promise<ClosingChecklistStatus> {
    const period = await this.prisma.accountingPeriod.findUnique({ where: { id: periodId } });
    if (!period) return { module: 'PRODUCTION', status: 'FAILED', validation_message: 'Period missing' };

    const activeProductions = await this.prisma.productionOrder.count({
      where: { store_id: storeId, status: { in: ['DRAFT', 'RELEASED', 'IN_PRODUCTION'] }, created_at: { gte: period.start_date, lte: period.end_date } }
    });

    if (activeProductions > 0) return { module: 'PRODUCTION', status: 'FAILED', validation_message: \`\${activeProductions} pending production orders.\` };

    return { module: 'PRODUCTION', status: 'PASSED' };
  }

  async runAllValidations(closingId: number, storeId: number, periodId: number, userId: number): Promise<boolean> {
    const results = await Promise.all([
      this.validateAccounting(storeId, periodId),
      this.validateInventory(storeId, periodId),
      this.validateProduction(storeId, periodId),
    ]);

    let allPassed = true;
    for (const res of results) {
      await this.repository.upsertChecklist(closingId, res.module, res.status, res.validation_message || '', userId);
      if (res.status === 'FAILED') allPassed = false;
    }

    return allPassed;
  }
}
`,

  'services/period-lock.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class PeriodLockService {
  constructor(private readonly prisma: PrismaService) {}

  async validatePostingPeriod(storeId: number, transactionDate: Date) {
    // Find the period matching this date
    const period = await this.prisma.accountingPeriod.findFirst({
      where: {
        store_id: storeId,
        start_date: { lte: transactionDate },
        end_date: { gte: transactionDate }
      }
    });

    if (!period) {
      throw new BadRequestException('Transaction date does not fall into any configured accounting period.');
    }

    // Check period closing lock status
    const closing = await this.prisma.periodClosing.findUnique({
      where: { accounting_period_id: period.id }
    });

    if (closing) {
      if (closing.status === 'CLOSED' || closing.status === 'LOCKED') {
        throw new BadRequestException(\`Cannot post transaction. Accounting period '\${period.name}' is \${closing.status}.\`);
      }
    }

    return period;
  }
}
`,

  'services/financial-period-closing.service.ts': `import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
    
    let closing = await this.repository.getClosingByPeriod(storeId, periodId);
    if (!closing) {
      closing = await this.repository.createOrUpdateClosing(storeId, period.fiscal_year_id, periodId, 'CLOSING', userId);
    } else if (closing.status === 'CLOSED' || closing.status === 'LOCKED') {
      throw new BadRequestException('Period is already closed or locked.');
    } else {
      closing = await this.repository.updateClosing(closing.id, { status: 'CLOSING' });
    }

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
`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(basePath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relativePath);
}
