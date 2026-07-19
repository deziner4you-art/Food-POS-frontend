import { Injectable, BadRequestException } from '@nestjs/common';
import { MonthEndClosingInput } from '../interfaces/month-end.interface';

@Injectable()
export class MonthEndValidator {
  validateClosingInput(input: MonthEndClosingInput) {
    if (!input.store_id || !input.accounting_period_id) {
      throw new BadRequestException('store_id and accounting_period_id are required');
    }
  }
}
