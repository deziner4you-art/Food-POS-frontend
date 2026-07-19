import { Injectable } from '@nestjs/common';
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
