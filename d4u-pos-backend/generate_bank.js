const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src/modules/business/accounting');

const files = {
  // Events
  'events/bank-statement-imported.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BankStatementImportedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BANK_STATEMENT_IMPORTED';
  occurred_at = new Date();
  entity_type = 'BANK_STATEMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/bank-transaction-matched.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BankTransactionMatchedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BANK_TRANSACTION_MATCHED';
  occurred_at = new Date();
  entity_type = 'BANK_STATEMENT_LINE';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/bank-reconciliation-completed.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BankReconciliationCompletedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BANK_RECONCILIATION_COMPLETED';
  occurred_at = new Date();
  entity_type = 'BANK_RECONCILIATION';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  'events/bank-reconciliation-adjustment-created.event.ts': `import { DomainEvent } from './domain-event.interface';
import { randomUUID } from 'crypto';

export class BankReconciliationAdjustmentCreatedEvent implements DomainEvent {
  event_id = randomUUID();
  event_name = 'BANK_RECONCILIATION_ADJUSTMENT_CREATED';
  occurred_at = new Date();
  entity_type = 'BANK_RECONCILIATION_ADJUSTMENT';

  constructor(public store_id: number, public tenant_id: number, public user_id: number, public entity_id: string, public correlation_id: string, public payload: any) {}
}
`,

  // Interfaces
  'interfaces/bank-statement.interface.ts': `export interface ImportStatementInput {
  store_id: number;
  account_id: number;
  statement_date: Date;
  opening_balance: number;
  closing_balance: number;
  lines: Array<{
    transaction_date: Date;
    description: string;
    reference_number?: string;
    amount: number;
  }>;
}
`,

  'interfaces/bank-reconciliation.interface.ts': `export interface RunReconciliationInput {
  store_id: number;
  statement_id: number;
}

export interface MatchTransactionInput {
  store_id: number;
  statement_line_id: number;
  journal_line_id: number;
}

export interface CreateAdjustmentInput {
  store_id: number;
  reconciliation_id: number;
  amount: number;
  reason: string;
  adjustment_account_id: number;
  statement_account_id: number;
}
`,

  'interfaces/reconciliation-result.interface.ts': `export interface ReconciliationResult {
  matched_count: number;
  unmatched_count: number;
  matched_amount: number;
  unmatched_amount: number;
}
`,

  // Repository
  'repositories/bank-reconciliation.repository.ts': `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma/prisma.service';

@Injectable()
export class BankReconciliationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStatement(data: any) {
    return this.prisma.bankStatement.create({ data, include: { lines: true } });
  }

  async getStatement(id: number) {
    return this.prisma.bankStatement.findUnique({ where: { id }, include: { lines: true } });
  }

  async createReconciliation(data: any) {
    return this.prisma.bankReconciliation.create({ data });
  }

  async updateReconciliationStatus(id: number, status: string, matchedAmount: number, unmatchedAmount: number) {
    return this.prisma.bankReconciliation.update({
      where: { id },
      data: { status, matched_amount: matchedAmount, unmatched_amount: unmatchedAmount }
    });
  }

  async matchStatementLine(lineId: number, journalLineId: number) {
    return this.prisma.bankStatementLine.update({
      where: { id: lineId },
      data: { is_reconciled: true, matched_journal_line_id: journalLineId }
    });
  }

  async getUnmatchedLines(statementId: number) {
    return this.prisma.bankStatementLine.findMany({
      where: { statement_id: statementId, is_reconciled: false }
    });
  }

  async getJournalLinesForMatching(storeId: number, accountId: number, startDate: Date, endDate: Date) {
    // Ideally we filter by account and date to find unreconciled GL lines
    return this.prisma.journalEntryLine.findMany({
      where: {
        account_id: accountId,
        journal_entry: { store_id: storeId, posting_date: { gte: startDate, lte: endDate } }
      },
      include: { journal_entry: true }
    });
  }

  async createAdjustment(data: any) {
    return this.prisma.bankReconciliationAdjustment.create({ data });
  }

  async getReconciliation(id: number) {
    return this.prisma.bankReconciliation.findUnique({
      where: { id },
      include: { statement: { include: { lines: true } }, adjustments: true }
    });
  }
}
`,

  // Validator
  'validators/bank-reconciliation.validator.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { ImportStatementInput } from '../interfaces/bank-statement.interface';

@Injectable()
export class BankReconciliationValidator {
  constructor(private readonly repository: BankReconciliationRepository) {}

  async validateImport(input: ImportStatementInput) {
    if (!input.account_id) throw new BadRequestException('Bank Account ID is required');
    if (input.lines.length === 0) throw new BadRequestException('Statement must have at least one line');
    // More validations can be added (e.g. checking for overlapping dates for the same account)
  }

  async validateMatch(lineId: number, journalLineId: number) {
    // Normally check if either are already matched
  }
}
`,

  // Services
  'services/bank-statement.service.ts': `import { Injectable } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { BankReconciliationValidator } from '../validators/bank-reconciliation.validator';
import { ImportStatementInput } from '../interfaces/bank-statement.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankStatementImportedEvent } from '../events/bank-statement-imported.event';

@Injectable()
export class BankStatementService {
  constructor(
    private readonly repository: BankReconciliationRepository,
    private readonly validator: BankReconciliationValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async importStatement(input: ImportStatementInput, userId: number) {
    await this.validator.validateImport(input);

    const statement = await this.repository.createStatement({
      store_id: input.store_id,
      account_id: input.account_id,
      statement_date: new Date(input.statement_date),
      opening_balance: input.opening_balance,
      closing_balance: input.closing_balance,
      status: 'IMPORTED',
      lines: {
        create: input.lines.map(line => ({
          transaction_date: new Date(line.transaction_date),
          description: line.description,
          reference_number: line.reference_number,
          amount: line.amount,
          is_reconciled: false
        }))
      }
    });

    this.eventBus.publish(new BankStatementImportedEvent(
      input.store_id, 0, userId, statement.id.toString(), 'statement_imported', { account_id: input.account_id }
    ));

    return statement;
  }
}
`,

  'services/reconciliation-matching.service.ts': `import { Injectable } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { MatchTransactionInput } from '../interfaces/bank-reconciliation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankTransactionMatchedEvent } from '../events/bank-transaction-matched.event';

@Injectable()
export class ReconciliationMatchingService {
  constructor(
    private readonly repository: BankReconciliationRepository,
    private readonly eventBus: DomainEventBusService
  ) {}

  async autoMatch(storeId: number, statementId: number, accountId: number, userId: number) {
    const unmatchedLines = await this.repository.getUnmatchedLines(statementId);
    if (unmatchedLines.length === 0) return { matched_count: 0 };

    // Get journal lines for the last month (example heuristic)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    const endDate = new Date();
    
    const journalLines = await this.repository.getJournalLinesForMatching(storeId, accountId, startDate, endDate);
    
    let matchedCount = 0;

    for (const line of unmatchedLines) {
      // Very basic auto-matching heuristic: Match exact amount
      // In real life: Match amount + near date + ref number
      const match = journalLines.find(jl => 
        (Number(jl.debit_amount) - Number(jl.credit_amount)) === Number(line.amount)
      );

      if (match) {
        await this.repository.matchStatementLine(line.id, match.id);
        matchedCount++;
        
        this.eventBus.publish(new BankTransactionMatchedEvent(
          storeId, 0, userId, line.id.toString(), 'auto_matched', { journal_line_id: match.id }
        ));
      }
    }

    return { matched_count: matchedCount };
  }

  async manualMatch(input: MatchTransactionInput, userId: number) {
    await this.repository.matchStatementLine(input.statement_line_id, input.journal_line_id);
    
    this.eventBus.publish(new BankTransactionMatchedEvent(
      input.store_id, 0, userId, input.statement_line_id.toString(), 'manual_matched', { journal_line_id: input.journal_line_id }
    ));

    return { success: true };
  }
}
`,

  'services/bank-reconciliation.service.ts': `import { Injectable, BadRequestException } from '@nestjs/common';
import { BankReconciliationRepository } from '../repositories/bank-reconciliation.repository';
import { ReconciliationMatchingService } from './reconciliation-matching.service';
import { JournalEntryService } from './journal-entry.service';
import { RunReconciliationInput, CreateAdjustmentInput } from '../interfaces/bank-reconciliation.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BankReconciliationCompletedEvent } from '../events/bank-reconciliation-completed.event';
import { BankReconciliationAdjustmentCreatedEvent } from '../events/bank-reconciliation-adjustment-created.event';

@Injectable()
export class BankReconciliationService {
  constructor(
    private readonly repository: BankReconciliationRepository,
    private readonly matchingService: ReconciliationMatchingService,
    private readonly journalService: JournalEntryService,
    private readonly eventBus: DomainEventBusService
  ) {}

  async runReconciliation(input: RunReconciliationInput, userId: number) {
    const statement = await this.repository.getStatement(input.statement_id);
    if (!statement) throw new BadRequestException('Statement not found');

    let recon = await this.repository.createReconciliation({
      store_id: input.store_id,
      statement_id: input.statement_id,
      reconciliation_date: new Date(),
      status: 'IN_PROGRESS',
      executed_by: userId
    });

    // Run Auto-matching
    await this.matchingService.autoMatch(input.store_id, input.statement_id, statement.account_id, userId);

    return recon;
  }

  async createAdjustment(input: CreateAdjustmentInput, userId: number) {
    const journalDto: any = {
      fiscal_year_id: 1, 
      accounting_period_id: 1,
      currency_id: 1,
      posting_date: new Date(),
      reference_number: \`ADJ-REC-\${input.reconciliation_id}\`,
      description: input.reason,
      lines: [
        {
          account_id: input.adjustment_account_id,
          debit_amount: input.amount > 0 ? input.amount : 0,
          credit_amount: input.amount < 0 ? Math.abs(input.amount) : 0,
          description: 'Reconciliation Adjustment'
        },
        {
          account_id: input.statement_account_id,
          debit_amount: input.amount < 0 ? Math.abs(input.amount) : 0,
          credit_amount: input.amount > 0 ? input.amount : 0,
          description: 'Reconciliation Adjustment Offset'
        }
      ]
    };

    const je = await this.journalService.create(input.store_id, journalDto);
    await this.journalService.submit(input.store_id, je.id);
    await this.journalService.approve(input.store_id, je.id);

    const adj = await this.repository.createAdjustment({
      reconciliation_id: input.reconciliation_id,
      journal_entry_id: je.id,
      amount: input.amount,
      reason: input.reason
    });

    this.eventBus.publish(new BankReconciliationAdjustmentCreatedEvent(
      input.store_id, 0, userId, adj.id.toString(), 'adjustment_created', { amount: input.amount }
    ));

    return adj;
  }

  async finalizeReconciliation(id: number, userId: number) {
    const recon = await this.repository.getReconciliation(id);
    if (!recon) throw new BadRequestException('Reconciliation not found');

    let matchedAmount = 0;
    let unmatchedAmount = 0;

    for (const line of recon.statement.lines) {
      if (line.is_reconciled) matchedAmount += Number(line.amount);
      else unmatchedAmount += Number(line.amount);
    }

    await this.repository.updateReconciliationStatus(id, 'COMPLETED', matchedAmount, unmatchedAmount);

    this.eventBus.publish(new BankReconciliationCompletedEvent(
      recon.store_id, 0, userId, recon.id.toString(), 'reconciliation_completed', { matched: matchedAmount, unmatched: unmatchedAmount }
    ));

    return { success: true };
  }

  async getReconciliation(id: number) {
    return this.repository.getReconciliation(id);
  }
}
`,

  // Controllers
  'controllers/bank-reconciliation.controller.ts': `import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { BankStatementService } from '../services/bank-statement.service';
import { BankReconciliationService } from '../services/bank-reconciliation.service';
import { ReconciliationMatchingService } from '../services/reconciliation-matching.service';

@Controller('accounting/bank-reconciliation')
export class BankReconciliationController {
  constructor(
    private readonly statementService: BankStatementService,
    private readonly reconciliationService: BankReconciliationService,
    private readonly matchingService: ReconciliationMatchingService
  ) {}

  @Post('import-statement')
  async importStatement(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.statementService.importStatement(body, userId);
  }

  @Post('run')
  async runReconciliation(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.reconciliationService.runReconciliation(body, userId);
  }

  @Post('match')
  async manualMatch(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.matchingService.manualMatch(body, userId);
  }

  @Post('adjustment')
  async createAdjustment(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.reconciliationService.createAdjustment(body, userId);
  }

  @Post(':id/finalize')
  async finalize(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 1;
    return this.reconciliationService.finalizeReconciliation(Number(id), userId);
  }

  @Get(':id')
  async getReconciliation(@Param('id') id: string) {
    return this.reconciliationService.getReconciliation(Number(id));
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
