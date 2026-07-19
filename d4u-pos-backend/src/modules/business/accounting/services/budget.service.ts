import { Injectable } from '@nestjs/common';
import { BudgetRepository } from '../repositories/budget.repository';
import { BudgetValidator } from '../validators/budget.validator';
import { CreateBudgetInput, BudgetResult } from '../interfaces/budget.interface';
import { DomainEventBusService } from '../events/domain-event-bus.service';
import { BudgetCreatedEvent } from '../events/budget-created.event';
import { BudgetApprovedEvent } from '../events/budget-approved.event';

@Injectable()
export class BudgetService {
  constructor(
    private readonly repository: BudgetRepository,
    private readonly validator: BudgetValidator,
    private readonly eventBus: DomainEventBusService
  ) {}

  async createBudget(input: CreateBudgetInput, userId: number): Promise<BudgetResult> {
    this.validator.validateCreation(input);

    const dataToSave = {
      ...input,
      user_id: userId,
      lines: input.lines.map(l => ({
        account_id: l.account_id,
        account_group_id: l.account_group_id,
        amount: l.amount,
        notes: l.notes
      }))
    };

    const result = await this.repository.createBudget(dataToSave);
    const activeVersion = result.versions[0];
    const totalAmount = activeVersion.lines.reduce((sum, line) => sum + Number(line.amount), 0);

    this.eventBus.publish(new BudgetCreatedEvent(
      result.store_id, 0, userId, result.id.toString(), 'budget_creation', { name: result.name }
    ));

    return {
      id: result.id,
      store_id: result.store_id,
      name: result.name,
      type: result.type,
      status: result.status,
      version: activeVersion.version_number,
      total_amount: totalAmount
    };
  }

  async approveBudget(budgetId: number, userId: number): Promise<any> {
    const budget = await this.repository.approveBudget(budgetId, userId);
    
    this.eventBus.publish(new BudgetApprovedEvent(
      budget.store_id, 0, userId, budget.id.toString(), 'budget_approval', {}
    ));

    return { success: true, status: budget.status };
  }
}
