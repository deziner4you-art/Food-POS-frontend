import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateBudgetInput } from '../interfaces/budget.interface';

@Injectable()
export class BudgetValidator {
  validateCreation(data: CreateBudgetInput) {
    if (!data.name || data.name.trim() === '') {
      throw new BadRequestException('Budget name is required');
    }
    if (!['ANNUAL', 'MONTHLY', 'DEPARTMENT'].includes(data.type)) {
      throw new BadRequestException('Invalid budget type');
    }
    if (!data.lines || data.lines.length === 0) {
      throw new BadRequestException('Budget lines are required');
    }
    
    for (const line of data.lines) {
      if (!line.account_id && !line.account_group_id) {
        throw new BadRequestException('Budget line must specify account_id or account_group_id');
      }
      if (line.amount < 0) {
        throw new BadRequestException('Budget amount cannot be negative');
      }
    }
  }
}
