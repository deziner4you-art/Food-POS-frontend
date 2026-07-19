import { Injectable, BadRequestException } from '@nestjs/common';
import { KpiFilter } from '../interfaces/financial-kpi.interface';

@Injectable()
export class FinancialKpiValidator {
  validateFilter(filter: KpiFilter) {
    if (filter.start_date > filter.end_date) {
      throw new BadRequestException('Start date cannot be after end date.');
    }
    return filter;
  }
}
